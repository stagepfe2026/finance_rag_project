import os
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider
from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.schemas import (
    DocumentActionResponse,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentSearchResponse,
    LegalStatus,
)
from app.services.documents.indexing.document_parser_service import DocumentParserService
from app.services.documents.indexing.document_pipeline_service import DocumentPipelineService
from app.services.documents.legal.document_relation_service import DocumentRelationService
from app.services.documents.legal.legal_metadata_service import LegalMetadataService
from app.services.documents.legal.legal_status_service import LegalStatusService
from app.services.documents.search.document_search_service import DocumentSearchService
from app.services.documents.storage.document_file_service import DocumentFileService
from app.services.notifications.notification_service import NotificationService
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.rag.processing.nlp_service import NLPService
from fastapi import HTTPException, UploadFile


class DocumentIndexService:
    MAX_UPLOAD_SIZE = 20 * 1024 * 1024

    def __init__(
        self,
        embedding_service: EmbeddingService,
        notification_service: NotificationService | None = None,
    ):
        self.parser_service = DocumentParserService()
        self.nlp_service = NLPService(FrenchNlpProvider())
        self.embedding_service = embedding_service
        self.notification_service = notification_service
        self.qdrant_repository = QdrantRepository()
        self.document_repository = DocumentRepository()
        self.legal_metadata_service = LegalMetadataService(self.document_repository)
        self.legal_status_service = LegalStatusService(self.document_repository)
        self.document_relation_service = DocumentRelationService(self.document_repository)
        self.storage_dir = Path(settings.documents_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.backend_dir = Path(__file__).resolve().parents[4]
        self.project_root = Path(__file__).resolve().parents[5]

        self.file_service = DocumentFileService(self.document_repository)
        self.pipeline_service = DocumentPipelineService(
            document_parser_service=self.parser_service,
            nlp_service=self.nlp_service,
            embedding_service=self.embedding_service,
            qdrant_repository=self.qdrant_repository,
            document_repository=self.document_repository,
            legal_status_service=self.legal_status_service,
        )
        self.search_service = DocumentSearchService(
            document_repository=self.document_repository,
            legal_status_service=self.legal_status_service,
        )

    async def import_and_index(
        self,
        file: UploadFile,
        category: str,
        title: str,
        realized_at: datetime | None = None,
        legal_status: str | None = None,
        document_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        relation_type: str | None = None,
        related_document_id: str | None = None,
        admin_id: str | None = None,
    ) -> dict:
        extension = os.path.splitext(file.filename or "")[1].lower()
        content = await file.read()
        if len(content) > self.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail="Le fichier depasse la taille maximale autorisee.")

        effective_date_publication = date_publication or datetime.now(UTC)
        prepared_legal_metadata = self.legal_metadata_service.build_legal_metadata(
            legal_status=None,
            document_type=document_type,
            date_publication=effective_date_publication,
            date_entree_vigueur=date_entree_vigueur,
            relation_type=relation_type,
            related_document_id=related_document_id,
        )
        if self.document_repository.already_exists(
            title=title,
            category=category,
            legal_type=str(prepared_legal_metadata["document_type"]),
        ):
            raise HTTPException(
                status_code=409,
                detail="Un document avec le meme titre, categorie et type existe deja.",
            )

        stored_file_path = self.file_service.store_uploaded_file(
            file.filename or "document", extension, content
        )

        document = DocumentModel.new_processing(
            title=title,
            category=category,
            legal_status=str(prepared_legal_metadata["legal_status"]),
            legal_type=str(prepared_legal_metadata["document_type"]),
            issued_at=realized_at,
            date_publication=prepared_legal_metadata["date_publication"],
            date_entree_vigueur=prepared_legal_metadata["date_entree_vigueur"],
            relation_to_target=str(prepared_legal_metadata["relation_type"]),
            target_document_id=prepared_legal_metadata["related_document_id"],
            file_path=str(stored_file_path),
            file_size=len(content),
            file_type=file.content_type or "application/octet-stream",
        )
        document = self.document_repository.save(document)

        try:
            cleaned_text, chunks = self.pipeline_service.parse_and_chunk(str(stored_file_path), extension)
            related_document_title = self._resolve_related_document_title(document.target_document_id)
            effective_legal_status = self.legal_status_service.resolve_status(document)
            inserted_count = self.pipeline_service.embed_and_upsert(
                category=category,
                document_id=document.id or "",
                document_title=document.title,
                document_name=file.filename or title,
                legal_type=document.legal_type,
                legal_status=effective_legal_status,
                date_publication=document.date_publication.isoformat() if document.date_publication else None,
                date_entree_vigueur=(
                    document.date_entree_vigueur.isoformat() if document.date_entree_vigueur else None
                ),
                relation_to_target=document.relation_to_target,
                target_document_id=document.target_document_id,
                related_document_title=related_document_title,
                issued_at=document.issued_at.isoformat() if document.issued_at else None,
                chunks=chunks,
            )

            stored_document = self.document_repository.set_as_indexed(
                document.id,
                chunk_count=len(chunks),
                extracted_text=cleaned_text,
                indexed_by_admin_id=admin_id,
            )
            if stored_document is not None:
                self.document_relation_service.apply_legal_succession(stored_document)
                if self.notification_service is not None:
                    await self.notification_service.alert_document_ready(stored_document)
                    # Notify users who favorited a document that this new doc replaces/supersedes
                    if related_document_id and relation_type in ("remplace", "abroge"):
                        deprecated = self.document_repository.get_by_id(related_document_id)
                        if deprecated is not None:
                            await self.notification_service.notify_document_deprecated_for_favorites(
                                deprecated, stored_document.title
                            )

            return {
                "document": (
                    self._with_effective_legal_status(stored_document).to_out_schema().model_dump()
                    if stored_document
                    else None
                ),
                "document_name": file.filename,
                "category": category,
                "document_type": extension.replace(".", ""),
                "chunks_count": len(chunks),
                "indexed_points": inserted_count,
            }
        except Exception as exc:
            self.document_repository.set_as_failed(document.id, str(exc))
            if self.notification_service is not None:
                try:
                    await self.notification_service.notify_indexation_failed(title, str(exc)[:200])
                except Exception:
                    pass
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
        return self.search_service.list_documents(
            search=search,
            category=category,
            status=status,
            current_user_id=current_user_id,
            skip=skip,
            limit=limit,
        )

    def publish_scheduled_documents(self, audit_service: Any | None = None) -> int:
        due_documents = self.document_repository.pending_activation(now=datetime.now(UTC))
        updated_count = 0
        for document in due_documents:
            if not document.id:
                continue
            previous_status = document.legal_status
            updated_document = self.document_repository.update_metadata(
                document.id,
                legal_status="actif",
            )
            if updated_document is None:
                continue
            updated_count += 1
            related_before = (
                self.document_repository.get_by_id(updated_document.target_document_id)
                if updated_document.target_document_id
                else None
            )
            self.document_relation_service.apply_legal_succession(updated_document)
            if audit_service is not None:
                try:
                    audit_service.log_system_event(
                        action_type="LEGAL_STATUS_AUTO_UPDATED",
                        action_label="Statut juridique automatique",
                        category="Gestion document",
                        entity_type="DOCUMENT",
                        entity_id=document.id,
                        entity_label=document.title,
                        summary=f"Statut juridique du document \"{document.title}\" mis a jour automatiquement.",
                        metadata={
                            "documentId": document.id,
                            "ancienStatut": previous_status,
                            "nouveauStatut": "actif",
                            "dateEntreeVigueur": document.date_entree_vigueur.isoformat()
                            if document.date_entree_vigueur
                            else None,
                            "raison": "activation automatique",
                        },
                    )
                except Exception:
                    pass
                if related_before is not None and related_before.id:
                    related_after = self.document_repository.get_by_id(related_before.id)
                    if related_after is not None and related_after.legal_status != related_before.legal_status:
                        try:
                            audit_service.log_system_event(
                                action_type="LEGAL_STATUS_AUTO_UPDATED",
                                action_label="Statut juridique automatique",
                                category="Gestion document",
                                entity_type="DOCUMENT",
                                entity_id=related_before.id,
                                entity_label=related_before.title,
                                summary=(
                                    f"Statut juridique du document \"{related_before.title}\" mis a jour "
                                    f"par relation juridique."
                                ),
                                metadata={
                                    "documentId": related_before.id,
                                    "ancienStatut": related_before.legal_status,
                                    "nouveauStatut": related_after.legal_status,
                                    "dateEntreeVigueur": updated_document.date_entree_vigueur.isoformat()
                                    if updated_document.date_entree_vigueur
                                    else None,
                                    "raison": "relation juridique",
                                    "sourceDocumentId": updated_document.id,
                                    "relationToTarget": updated_document.relation_to_target,
                                },
                            )
                        except Exception:
                            pass
        return updated_count

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
        return self.search_service.search_documents(
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

    def get_document_file_response_data(self, document_id: str) -> tuple[Path, str]:
        return self.file_service.get_file_response_data(document_id)

    def get_document_preview(self, document_id: str) -> DocumentPreviewOut:
        document = self._require_document(document_id)

        preview_content = (document.extracted_text or "").strip()
        if not preview_content:
            file_path = self.file_service.resolve_existing_file_path(document.file_path)
            if file_path is None:
                raise HTTPException(status_code=404, detail="Contenu du document introuvable.")
            preview_content = self.nlp_service.preprocess_document(
                self.parser_service.parse_document(str(file_path), file_path.suffix.lower())
            )

        if not preview_content:
            raise HTTPException(status_code=404, detail="Contenu du document introuvable.")

        document.extracted_text = preview_content
        return self._with_effective_legal_status(document).to_preview_schema()

    def set_document_favorite(
        self,
        document_id: str,
        is_favorite: bool,
        *,
        current_user_id: str,
    ) -> DocumentActionResponse:
        return self.search_service.set_document_favorite(
            document_id,
            is_favorite,
            current_user_id=current_user_id,
        )

    def delete_document_from_index(self, document_id: str, admin_id: str | None = None) -> DocumentActionResponse:
        document = self._require_document(document_id)
        effective_legal_status = self.legal_status_service.resolve_status(document)
        if effective_legal_status not in {LegalStatus.actif.value, LegalStatus.remplace.value}:
            raise HTTPException(status_code=400, detail="Ce document ne peut pas etre supprime.")

        self.qdrant_repository.delete_by_document(document.category, document_id)
        updated_document = self.document_repository.remove(document_id, deleted_by_admin_id=admin_id)
        return DocumentActionResponse(
            message="Document supprime avec succes.",
            data=self._with_effective_legal_status(updated_document).to_out_schema()
            if updated_document
            else None,
        )

    def reindex_document(self, document_id: str, admin_id: str | None = None) -> DocumentActionResponse:
        document = self._require_document(document_id)
        file_path = self.file_service.resolve_existing_file_path(document.file_path)
        if file_path is None:
            raise HTTPException(
                status_code=404, detail="Fichier du document introuvable pour la reindexation."
            )

        self.document_repository.set_as_processing(document_id)

        try:
            extension = file_path.suffix.lower()
            cleaned_text, chunks = self.pipeline_service.parse_and_chunk(str(file_path), extension)

            self.qdrant_repository.delete_by_document(document.category, document_id)
            updated_document = self.document_repository.set_as_indexed(
                document_id,
                chunk_count=len(chunks),
                extracted_text=cleaned_text,
                indexed_by_admin_id=admin_id,
            )
            if updated_document is not None:
                related_document_title = self._resolve_related_document_title(updated_document.target_document_id)
                self.qdrant_repository.delete_by_document(updated_document.category, document_id)
                self.pipeline_service.embed_and_upsert(
                    category=updated_document.category,
                    document_id=document_id,
                    document_title=updated_document.title,
                    document_name=file_path.name,
                    legal_type=updated_document.legal_type,
                    legal_status=self.legal_status_service.resolve_status(updated_document),
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
                    relation_to_target=updated_document.relation_to_target,
                    target_document_id=updated_document.target_document_id,
                    related_document_title=related_document_title,
                    issued_at=updated_document.issued_at.isoformat() if updated_document.issued_at else None,
                    chunks=chunks,
                )
                self.document_relation_service.apply_legal_succession(updated_document)
            return DocumentActionResponse(
                message="Document reindexe avec succes.",
                data=self._with_effective_legal_status(updated_document).to_out_schema()
                if updated_document
                else None,
            )
        except Exception as exc:
            self.document_repository.set_as_failed(document_id, str(exc))
            raise HTTPException(
                status_code=500,
                detail=str(exc),
            ) from exc

    def _require_document(self, document_id: str) -> DocumentModel:
        document = self.document_repository.get_by_id(document_id)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")
        return document

    def _with_effective_legal_status(self, document: DocumentModel) -> DocumentModel:
        document.legal_status = self.legal_status_service.resolve_status(document)
        return document

    def _resolve_related_document_title(self, related_document_id: str | None) -> str | None:
        if not related_document_id:
            return None

        related_document = self.document_repository.get_by_id(related_document_id)
        if related_document is None:
            return None
        return related_document.title
