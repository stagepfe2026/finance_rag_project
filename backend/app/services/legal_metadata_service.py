from datetime import datetime

from app.repositories.document_repository import DocumentRepository
from app.schemas import LegalDocumentType, LegalRelationType, LegalStatus
from bson import ObjectId
from fastapi import HTTPException


class LegalMetadataService:
    def __init__(self, document_repository: DocumentRepository | None = None) -> None:
        self.document_repository = document_repository or DocumentRepository()

    def prepare_metadata(
        self,
        *,
        legal_status: str | None,
        document_type: str | None,
        date_publication: datetime | None,
        date_entree_vigueur: datetime | None,
        version: str | None,
        relation_type: str | None,
        related_document_id: str | None,
    ) -> dict[str, object | None]:
        normalized_relation_type = relation_type or LegalRelationType.none.value
        self._validate_relation_type(normalized_relation_type)

        normalized_document_type = document_type or LegalDocumentType.autre.value
        self._validate_document_type(normalized_document_type)

        normalized_related_document_id = (related_document_id or "").strip() or None
        if normalized_relation_type == LegalRelationType.none.value:
            normalized_related_document_id = None
        elif normalized_related_document_id is None:
            raise HTTPException(
                status_code=400,
                detail="relatedDocumentId est requis lorsqu une relation juridique est renseignee.",
            )

        if normalized_related_document_id is not None:
            self.ensure_related_document_exists(normalized_related_document_id)

        normalized_legal_status = legal_status or self._default_legal_status(normalized_relation_type)
        self._validate_legal_status(normalized_legal_status)

        normalized_version = (version or "").strip()

        return {
            "legal_status": normalized_legal_status,
            "document_type": normalized_document_type,
            "date_publication": date_publication,
            "date_entree_vigueur": date_entree_vigueur,
            "version": normalized_version,
            "relation_type": normalized_relation_type,
            "related_document_id": normalized_related_document_id,
        }

    def ensure_related_document_exists(self, document_id: str) -> None:
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="relatedDocumentId est invalide.")

        related_document = self.document_repository.get_by_id(document_id)
        if related_document is None or related_document.deleted_at is not None:
            raise HTTPException(status_code=400, detail="Le document juridique lie est introuvable.")

    @staticmethod
    def _default_legal_status(relation_type: str) -> str:
        if relation_type in {
            LegalRelationType.none.value,
            LegalRelationType.remplace.value,
            LegalRelationType.modifie.value,
            LegalRelationType.abroge.value,
        }:
            return LegalStatus.en_vigueur.value
        return LegalStatus.inconnu.value

    @staticmethod
    def _validate_legal_status(legal_status: str) -> None:
        allowed = {item.value for item in LegalStatus}
        if legal_status not in allowed:
            raise HTTPException(
                status_code=400,
                detail="legalStatus doit etre une valeur juridique valide.",
            )

    @staticmethod
    def _validate_document_type(document_type: str) -> None:
        allowed = {item.value for item in LegalDocumentType}
        if document_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail="documentType doit etre une valeur documentaire valide.",
            )

    @staticmethod
    def _validate_relation_type(relation_type: str) -> None:
        allowed = {item.value for item in LegalRelationType}
        if relation_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail="relationType doit etre une valeur relationnelle valide.",
            )
