import os
import re
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import NLPProvider
from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.schemas import (
    DocumentActionResponse,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentSearchResponse,
)
from app.services.document_parser_service import DocumentParserService
from app.services.document_relation_service import DocumentRelationService
from app.services.embedding_service import EmbeddingService
from app.services.legal_metadata_service import LegalMetadataService
from app.services.nlp_service import NLPService
from app.services.notification_service import NotificationService
from fastapi import HTTPException, UploadFile


class DocumentIndexService:
    def __init__(
        self,
        embedding_service: EmbeddingService,
        notification_service: NotificationService | None = None,
    ):
        self.parser_service = DocumentParserService()
        self.nlp_service = NLPService(NLPProvider())
        self.embedding_service = embedding_service
        self.notification_service = notification_service
        self.qdrant_repository = QdrantRepository()
        self.document_repository = DocumentRepository()
        self.legal_metadata_service = LegalMetadataService(self.document_repository)
        self.document_relation_service = DocumentRelationService(self.document_repository)
        self.storage_dir = Path(settings.documents_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.backend_dir = Path(__file__).resolve().parents[2]
        self.project_root = Path(__file__).resolve().parents[3]

    async def index_document(
        self,
        file: UploadFile,
        category: str,
        title: str,
        description: str,
        realized_at: datetime | None = None,
        legal_status: str | None = None,
        document_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        version: str | None = None,
        relation_type: str | None = None,
        related_document_id: str | None = None,
    ) -> dict:
        extension = os.path.splitext(file.filename or "")[1].lower()
        content = await file.read()
        stored_file_path = self._store_uploaded_file(
            file.filename or "document", extension, content
        )
        prepared_legal_metadata = self.legal_metadata_service.prepare_metadata(
            legal_status=legal_status,
            document_type=document_type,
            date_publication=date_publication,
            date_entree_vigueur=date_entree_vigueur,
            version=version,
            relation_type=relation_type,
            related_document_id=related_document_id,
        )

        document = DocumentModel.new_processing(
            title=title,
            category=category,
            description=description,
            legal_status=str(prepared_legal_metadata["legal_status"]),
            document_type=str(prepared_legal_metadata["document_type"]),
            realized_at=realized_at,
            date_publication=prepared_legal_metadata["date_publication"],
            date_entree_vigueur=prepared_legal_metadata["date_entree_vigueur"],
            version=str(prepared_legal_metadata["version"]),
            relation_type=str(prepared_legal_metadata["relation_type"]),
            related_document_id=prepared_legal_metadata["related_document_id"],
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
            related_document_title = self._resolve_related_document_title(document.related_document_id)
            inserted_count = self.qdrant_repository.upsert_chunks(
                category=category,
                document_id=document.id or "",
                document_title=document.title,
                document_name=file.filename or title,
                document_type=document.document_type,
                legal_status=document.legal_status,
                date_publication=document.date_publication.isoformat() if document.date_publication else None,
                date_entree_vigueur=(
                    document.date_entree_vigueur.isoformat() if document.date_entree_vigueur else None
                ),
                version=document.version,
                relation_type=document.relation_type,
                related_document_id=document.related_document_id,
                related_document_title=related_document_title,
                realized_at=document.realized_at.isoformat() if document.realized_at else None,
                chunks=chunks,
                embeddings=embeddings,
            )

            stored_document = self.document_repository.mark_indexed(
                document.id,
                chunks_count=len(chunks),
                content=cleaned_text,
            )
            if stored_document is not None:
                self.document_relation_service.apply_relation_after_index(stored_document)
                if self.notification_service is not None:
                    await self.notification_service.notify_document_indexed(stored_document)

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
        current_user_id: str | None = None,
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
            items=[
                document.to_out_schema(
                    is_favored=bool(current_user_id and current_user_id in document.favorite_user_ids)
                )
                for document in documents
            ],
            total=total,
        )

    def search_documents(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
        current_user_id: str | None = None,
        sort_by: str = "recent",
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentSearchResponse:
        documents = self.document_repository.search_documents(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
            current_user_id=current_user_id,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )
        total = self.document_repository.count_search_documents(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
            current_user_id=current_user_id,
        )
        return DocumentSearchResponse(
            items=[
                self._to_search_item(
                    document,
                    query=query,
                    current_user_id=current_user_id,
                )
                for document in documents
            ],
            total=total,
        )

    def get_document_file_response_data(self, document_id: str) -> tuple[Path, str]:
        document = self._require_document(document_id)

        file_path = self._resolve_existing_file_path(document.file_path)
        if file_path is None:
            raise HTTPException(
                status_code=404,
                detail="Fichier du document introuvable. Les anciens documents indexes avant cette mise a jour peuvent ne pas etre consultables.",
            )

        return file_path, document.file_type

    def get_document_preview(self, document_id: str) -> DocumentPreviewOut:
        document = self._require_document(document_id)

        preview_content = (document.content or "").strip()
        if not preview_content:
            file_path = self._resolve_existing_file_path(document.file_path)
            if file_path is None:
                raise HTTPException(status_code=404, detail="Contenu du document introuvable.")
            preview_content = self.nlp_service.preprocess_document(
                self.parser_service.parse_document(str(file_path), file_path.suffix.lower())
            )

        if not preview_content:
            raise HTTPException(status_code=404, detail="Contenu du document introuvable.")

        document.content = preview_content
        return document.to_preview_schema()

    def set_document_favorite(
        self,
        document_id: str,
        is_favored: bool,
        *,
        current_user_id: str,
    ) -> DocumentActionResponse:
        if not current_user_id.strip():
            raise HTTPException(status_code=401, detail="Authentification requise.")

        document = self.document_repository.set_favorite(document_id, current_user_id, is_favored)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")

        return DocumentActionResponse(
            message="Favori mis a jour avec succes.",
            data=document.to_out_schema(
                is_favored=current_user_id in document.favorite_user_ids,
            ),
        )

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
        file_path = self._resolve_existing_file_path(document.file_path)
        if file_path is None:
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
            updated_document = self.document_repository.mark_indexed(
                document_id,
                chunks_count=len(chunks),
                content=cleaned_text,
            )
            if updated_document is not None:
                related_document_title = self._resolve_related_document_title(updated_document.related_document_id)
                self.qdrant_repository.delete_document_chunks(updated_document.category, document_id)
                self.qdrant_repository.upsert_chunks(
                    category=updated_document.category,
                    document_id=document_id,
                    document_title=updated_document.title,
                    document_name=file_path.name,
                    document_type=updated_document.document_type,
                    legal_status=updated_document.legal_status,
                    date_publication=(
                        updated_document.date_publication.isoformat()
                        if updated_document.date_publication
                        else None
                    ),
                    date_entree_vigueur=(
                        updated_document.date_entree_vigueur.isoformat()
                        if updated_document.date_entree_vigueur
                        else None
                    ),
                    version=updated_document.version,
                    relation_type=updated_document.relation_type,
                    related_document_id=updated_document.related_document_id,
                    related_document_title=related_document_title,
                    realized_at=updated_document.realized_at.isoformat() if updated_document.realized_at else None,
                    chunks=chunks,
                    embeddings=embeddings,
                )
                self.document_relation_service.apply_relation_after_index(updated_document)
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

    def _resolve_existing_file_path(self, stored_file_path: str) -> Path | None:
        normalized_value = (stored_file_path or "").strip()
        if not normalized_value:
            return None

        normalized_path = Path(normalized_value.replace("\\", "/"))
        candidate_paths: list[Path] = []

        if normalized_path.is_absolute():
            candidate_paths.append(normalized_path)
        else:
            candidate_paths.extend(
                [
                    normalized_path,
                    self.backend_dir / normalized_path,
                    self.project_root / normalized_path,
                ]
            )

        storage_candidates = [
            self.storage_dir,
            self.backend_dir / settings.documents_storage_dir,
            self.project_root / settings.documents_storage_dir,
            self.backend_dir / "storage" / "documents",
        ]

        file_name = normalized_path.name
        if file_name:
            candidate_paths.extend(base / file_name for base in storage_candidates)

        seen: set[str] = set()
        for candidate in candidate_paths:
            resolved = candidate.expanduser()
            key = str(resolved)
            if key in seen:
                continue
            seen.add(key)

            if resolved.exists() and resolved.is_file():
                return resolved

        return None

    def _to_search_item(
        self,
        document: DocumentModel,
        *,
        query: str | None,
        current_user_id: str | None,
    ):
        return document.to_search_item_schema(
            snippets=self._build_snippets(document, query=query),
            is_favored=bool(current_user_id and current_user_id in document.favorite_user_ids),
        )

    def _build_snippets(self, document: DocumentModel, *, query: str | None) -> list[str]:
        source = "\n".join(
            part.strip() for part in [document.description or "", document.content or ""] if part and part.strip()
        ).strip()
        if not source:
            return []

        sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", source) if item.strip()]
        if not sentences:
            return [source[:220].strip()]

        query_terms = [term for term in re.split(r"\s+", (query or "").strip().lower()) if len(term) >= 2]
        matches: list[str] = []

        if query_terms:
            for sentence in sentences:
                lowered = sentence.lower()
                if any(term in lowered for term in query_terms):
                    matches.append(sentence)
                if len(matches) == 3:
                    break

        if matches:
            return matches

        return sentences[:2]

    def _resolve_related_document_title(self, related_document_id: str | None) -> str | None:
        if not related_document_id:
            return None

        related_document = self.document_repository.get_by_id(related_document_id)
        if related_document is None:
            return None
        return related_document.title
