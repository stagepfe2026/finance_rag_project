from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.schemas import LegalRelationType, LegalStatus
from app.services.documents.legal.legal_status_service import LegalStatusService
from fastapi import HTTPException


class DocumentRelationService:
    # Initialise le service avec le repository de documents et le service de statut juridique.
    def __init__(self, document_repository: DocumentRepository | None = None) -> None:
        self.document_repository = document_repository or DocumentRepository()
        self.legal_status_service = LegalStatusService(self.document_repository)

    # Applique l'effet juridique d'un nouveau document sur son document cible.
    def apply_legal_succession(self, source_document: DocumentModel) -> None:
        # Applique l'effet juridique d'un nouveau document sur son document cible.
        relation_to_target = source_document.relation_to_target
        related_document_id = source_document.target_document_id

        if (
            relation_to_target == LegalRelationType.none.value
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

        if self.legal_status_service.is_scheduled(source_document):
            # Un texte futur ne remplace pas immediatement l'ancien texte.
            if source_document.id:
                self.document_repository.update_metadata(
                    source_document.id,
                    legal_status=LegalStatus.futur.value,
                )
            effective_related_status = self.legal_status_service.resolve_status(
                related_document
            )
            if related_document.id:
                self.document_repository.update_metadata(
                    related_document.id,
                    legal_status=effective_related_status,
                )
            return

        if not self.legal_status_service.source_may_supersede_target(
            source_document,
            related_document,
        ):
            # Si la date ne permet pas la succession, le nouveau document reste actif seul.
            if source_document.id:
                self.document_repository.update_metadata(
                    source_document.id,
                    legal_status=LegalStatus.actif.value,
                )
            return

        if source_document.id:
            self.document_repository.update_metadata(
                source_document.id,
                legal_status=LegalStatus.actif.value,
            )

        # Le document cible devient remplace/abroge selon la relation declaree.
        self.document_repository.register_as_target(
            related_document_id,
            relation_to_target,
            source_document.id,
        )
