from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.schemas import LegalRelationType, LegalStatus
from app.services.legal_status_service import LegalStatusService
from fastapi import HTTPException


class DocumentRelationService:
    def __init__(self, document_repository: DocumentRepository | None = None) -> None:
        self.document_repository = document_repository or DocumentRepository()
        self.legal_status_service = LegalStatusService(self.document_repository)

    def apply_relation_after_index(self, source_document: DocumentModel) -> None:
        relation_type = source_document.relation_type
        related_document_id = source_document.related_document_id

        if (
            relation_type == LegalRelationType.none.value
            or not related_document_id
            or not source_document.id
        ):
            return

        if related_document_id == source_document.id:
            raise HTTPException(
                status_code=400,
                detail="Un document ne peut pas etre lie a lui-meme.",
            )

        related_document = self.document_repository.get_by_id(related_document_id)
        if related_document is None or related_document.deleted_at is not None:
            raise HTTPException(
                status_code=400,
                detail="Le document juridique cible est introuvable.",
            )

        if self.legal_status_service.is_future_document(source_document):
            if source_document.id:
                self.document_repository.update_legal_metadata(
                    source_document.id,
                    legal_status=LegalStatus.futur.value,
                )
            return

        related_document_status = self.legal_status_service.compute_effective_legal_status(
            related_document
        )
        if related_document_status != LegalStatus.actif.value:
            return

        if source_document.id:
            self.document_repository.update_legal_metadata(
                source_document.id,
                legal_status=LegalStatus.actif.value,
            )

        self.document_repository.apply_incoming_relation(
            related_document_id,
            relation_type,
            source_document.id,
        )
