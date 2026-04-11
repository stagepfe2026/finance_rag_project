import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import NLPProvider
from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.schemas import DocumentActionResponse, DocumentListResponse, DocumentPreviewOut
from app.services.document_parser_service import DocumentParserService
from app.services.embedding_service import EmbeddingService
from app.services.nlp_service import NLPService
from fastapi import HTTPException, UploadFile


class DocumentIndexService:
    def __init__(self, embedding_service: EmbeddingService):
        self.parser_service = DocumentParserService()
        self.nlp_service = NLPService(NLPProvider())
        self.embedding_service = embedding_service
        self.qdrant_repository = QdrantRepository()
        self.document_repository = DocumentRepository()
        self.storage_dir = Path(settings.documents_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    async def index_document(
        self,
        file: UploadFile,
        category: str,
        title: str,
        description: str,
        realized_at: datetime | None = None,
    ) -> dict:
        extension = os.path.splitext(file.filename or "")[1].lower()
        content = await file.read()
        stored_file_path = self._store_uploaded_file(
            file.filename or "document", extension, content
        )

        document = DocumentModel.new_processing(
            title=title,
            category=category,
            description=description,
            realized_at=realized_at,
            file_path=str(stored_file_path),
            file_size=len(content),
            file_type=file.content_type or "application/octet-stream",
        )
        document = self.document_repository.create(document)

        try:
            raw_text = self.parser_service.parse_document(str(stored_file_path), extension)
            cleaned_text = self.nlp_service.preprocess_document(raw_text)

            if not cleaned_text.strip():
                raise ValueError("Le document est vide ou le texte n a pas pu etre extrait.")

            chunks = self.nlp_service.prepare_chunks(cleaned_text)
            if not chunks:
                raise ValueError("Aucun chunk genere a partir du document.")

            embeddings = self.embedding_service.generate_embeddings(chunks)
            inserted_count = self.qdrant_repository.upsert_chunks(
                category=category,
                document_id=document.id or "",
                document_name=file.filename or title,
                document_type=extension.replace(".", ""),
                chunks=chunks,
                embeddings=embeddings,
            )

            stored_document = self.document_repository.mark_indexed(
                document.id,
                chunks_count=len(chunks),
                content=cleaned_text,
            )

            return {
                "document": (
                    stored_document.to_out_schema().model_dump() if stored_document else None
                ),
                "document_name": file.filename,
                "category": category,
                "document_type": extension.replace(".", ""),
                "chunks_count": len(chunks),
                "indexed_points": inserted_count,
            }
        except Exception as exc:
            self.document_repository.mark_failed(document.id, str(exc))
            raise

    def list_documents(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentListResponse:
        documents = self.document_repository.list_documents(
            search=search,
            category=category,
            status=status,
            skip=skip,
            limit=limit,
        )
        total = self.document_repository.count_documents(
            search=search,
            category=category,
            status=status,
        )
        return DocumentListResponse(
            items=[document.to_out_schema() for document in documents],
            total=total,
        )

    def get_document_file_response_data(self, document_id: str) -> tuple[Path, str]:
        document = self._require_document(document_id)

        file_path = Path(document.file_path)
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(
                status_code=404,
                detail="Fichier du document introuvable. Les anciens documents indexes avant cette mise a jour peuvent ne pas etre consultables.",
            )

        return file_path, document.file_type

    def get_document_preview(self, document_id: str) -> DocumentPreviewOut:
        document = self._require_document(document_id)

        normalized_type = (document.file_type or "").lower()
        if "word" not in normalized_type and not document.file_path.lower().endswith(".docx"):
            raise HTTPException(
                status_code=400,
                detail="La previsualisation textuelle est reservee aux documents Word.",
            )

        preview_content = (document.content or "").strip()
        if not preview_content:
            file_path = Path(document.file_path)
            if not file_path.exists() or not file_path.is_file():
                raise HTTPException(status_code=404, detail="Contenu du document introuvable.")
            preview_content = self.nlp_service.preprocess_document(
                self.parser_service.parse_document(str(file_path), ".docx")
            )

        if not preview_content:
            raise HTTPException(status_code=404, detail="Contenu du document introuvable.")

        document.content = preview_content
        return document.to_preview_schema()

    def delete_document_from_index(self, document_id: str) -> DocumentActionResponse:
        document = self._require_document(document_id)
        self.qdrant_repository.delete_document_chunks(document.category, document_id)
        updated_document = self.document_repository.mark_failed(
            document_id,
            "Document retire de l index Qdrant. Reindexation necessaire pour la recherche.",
        )
        return DocumentActionResponse(
            message="Document supprime de l index Qdrant.",
            data=updated_document.to_out_schema() if updated_document else None,
        )

    def reindex_document(self, document_id: str) -> DocumentActionResponse:
        document = self._require_document(document_id)
        file_path = Path(document.file_path)
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(
                status_code=404, detail="Fichier du document introuvable pour la reindexation."
            )

        self.document_repository.mark_processing(document_id)

        try:
            extension = file_path.suffix.lower()
            raw_text = self.parser_service.parse_document(str(file_path), extension)
            cleaned_text = self.nlp_service.preprocess_document(raw_text)

            if not cleaned_text.strip():
                raise ValueError("Le document est vide ou le texte n a pas pu etre extrait.")

            chunks = self.nlp_service.prepare_chunks(cleaned_text)
            if not chunks:
                raise ValueError("Aucun chunk genere a partir du document.")

            embeddings = self.embedding_service.generate_embeddings(chunks)
            self.qdrant_repository.delete_document_chunks(document.category, document_id)
            self.qdrant_repository.upsert_chunks(
                category=document.category,
                document_id=document_id,
                document_name=file_path.name,
                document_type=extension.replace(".", ""),
                chunks=chunks,
                embeddings=embeddings,
            )
            updated_document = self.document_repository.mark_indexed(
                document_id,
                chunks_count=len(chunks),
                content=cleaned_text,
            )
            return DocumentActionResponse(
                message="Document reindexe avec succes.",
                data=updated_document.to_out_schema() if updated_document else None,
            )
        except Exception as exc:
            self.document_repository.mark_failed(document_id, str(exc))
            raise HTTPException(
                status_code=500,
                detail=str(exc),
            ) from exc

    def _require_document(self, document_id: str) -> DocumentModel:
        document = self.document_repository.get_by_id(document_id)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")
        return document

    def _store_uploaded_file(self, original_name: str, extension: str, content: bytes) -> Path:
        safe_stem = Path(original_name).stem or "document"
        normalized_stem = "".join(
            char if char.isalnum() or char in {"-", "_"} else "-" for char in safe_stem
        )
        normalized_stem = normalized_stem.strip("-_") or "document"
        target_name = f"{normalized_stem}-{uuid4().hex}{extension}"
        target_path = self.storage_dir / target_name
        target_path.write_bytes(content)
        return target_path
