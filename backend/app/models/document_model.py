from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.schemas import (
    DocumentCategory,
    DocumentOut,
    DocumentPreviewOut,
    DocumentSearchItemOut,
    DocumentStatus,
    LegalDocumentType,
    LegalRelationType,
    LegalStatus,
)


def _normalize_legal_status(value: object) -> str:
    normalized = str(value or "").strip().lower()
    legacy_mapping = {
        "en_vigueur": LegalStatus.actif.value,
        "modifie": LegalStatus.actif.value,
        "inconnu": LegalStatus.actif.value,
        "": LegalStatus.actif.value,
    }
    normalized = legacy_mapping.get(normalized, normalized)
    allowed = {item.value for item in LegalStatus}
    return normalized if normalized in allowed else LegalStatus.actif.value


@dataclass
class DocumentModel:
    title: str
    category: str
    status: str
    legal_status: str
    legal_type: str
    issued_at: datetime | None
    date_publication: datetime | None
    date_entree_vigueur: datetime | None
    version: str
    relation_to_target: str
    target_document_id: str | None
    file_path: str
    file_size: int
    file_type: str
    created_at: datetime
    description: str = ""
    deleted_at: datetime | None = None
    indexed_at: datetime | None = None
    chunk_count: int | None = None
    last_index_error: str | None = None
    indexed_by_admin_id: str | None = None
    deleted_by_admin_id: str | None = None
    id: str | None = None
    extracted_text: str | None = None

    @classmethod
    def new_processing(
        cls,
        *,
        title: str,
        category: str,
        legal_status: str,
        legal_type: str,
        issued_at: datetime | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        version: str = "",
        relation_to_target: str = LegalRelationType.none.value,
        target_document_id: str | None = None,
        file_path: str,
        file_size: int,
        file_type: str,
        description: str = "",
        extracted_text: str | None = None,
    ) -> "DocumentModel":
        return cls(
            title=title.strip(),
            category=category,
            status=DocumentStatus.processing.value,
            legal_status=legal_status,
            legal_type=legal_type,
            issued_at=issued_at,
            date_publication=date_publication,
            date_entree_vigueur=date_entree_vigueur,
            version=version.strip(),
            relation_to_target=relation_to_target,
            target_document_id=target_document_id,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            created_at=datetime.now(UTC),
            description=description,
            extracted_text=extracted_text,
        )

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "DocumentModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            title=str(raw.get("title", "")),
            category=str(raw.get("category", "other")),
            status=str(raw.get("status", DocumentStatus.processing.value)),
            legal_status=_normalize_legal_status(raw.get("legalStatus", LegalStatus.actif.value)),
            legal_type=str(raw.get("legalType", LegalDocumentType.autre.value)),
            issued_at=raw.get("issuedAt"),
            date_publication=raw.get("datePublication"),
            date_entree_vigueur=raw.get("dateEntreeVigueur"),
            version=str(raw.get("version", "")),
            relation_to_target=str(raw.get("relationToTarget", LegalRelationType.none.value)),
            target_document_id=(
                str(raw.get("targetDocumentId"))
                if raw.get("targetDocumentId") is not None
                else None
            ),
            file_path=str(raw.get("filePath", "")),
            file_size=int(raw.get("fileSize", 0)),
            file_type=str(raw.get("fileType", "application/octet-stream")),
            created_at=raw.get("createdAt") or datetime.now(UTC),
            description=str(raw.get("description", "")),
            deleted_at=raw.get("deletedAt"),
            indexed_at=raw.get("indexedAt"),
            chunk_count=raw.get("chunkCount"),
            last_index_error=raw.get("lastIndexError"),
            indexed_by_admin_id=raw.get("indexedByAdminId"),
            deleted_by_admin_id=raw.get("deletedByAdminId"),
            extracted_text=raw.get("extractedText"),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "category": self.category,
            "status": self.status,
            "legalStatus": self.legal_status,
            "legalType": self.legal_type,
            "issuedAt": self.issued_at,
            "datePublication": self.date_publication,
            "dateEntreeVigueur": self.date_entree_vigueur,
            "version": self.version,
            "relationToTarget": self.relation_to_target,
            "targetDocumentId": self.target_document_id,
            "filePath": self.file_path,
            "fileSize": self.file_size,
            "fileType": self.file_type,
            "description": self.description,
            "createdAt": self.created_at,
            "deletedAt": self.deleted_at,
            "indexedAt": self.indexed_at,
            "chunkCount": self.chunk_count,
            "lastIndexError": self.last_index_error,
            "indexedByAdminId": self.indexed_by_admin_id,
            "deletedByAdminId": self.deleted_by_admin_id,
            "extractedText": self.extracted_text,
        }

    def _get_category_enum(self) -> DocumentCategory:
        old_to_new = {
            "Lois des finances": "finance",
            "Notes communes": "notes",
            "Conventions de non double imposition": "conventions",
            "Recueils de textes fiscaux": "recueil",
            "Autre documentation utile": "other",
        }
        category_value = self.category
        if category_value in old_to_new:
            category_value = old_to_new[category_value]
        return DocumentCategory(category_value)

    def to_out_schema(self, *, is_favored: bool | None = None) -> DocumentOut:
        return DocumentOut(
            id=self.id or "",
            title=self.title,
            category=self._get_category_enum(),
            status=DocumentStatus(self.status),
            legalStatus=LegalStatus(self.legal_status),
            legalType=LegalDocumentType(self.legal_type),
            issuedAt=self.issued_at,
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationToTarget=LegalRelationType(self.relation_to_target),
            targetDocumentId=self.target_document_id,
            filePath=self.file_path,
            fileSize=self.file_size,
            fileType=self.file_type,
            isFavorite=bool(is_favored),
            createdAt=self.created_at,
            deletedAt=self.deleted_at,
            indexedAt=self.indexed_at,
            chunkCount=self.chunk_count,
            lastIndexError=self.last_index_error,
            indexedByAdminId=self.indexed_by_admin_id,
            deletedByAdminId=self.deleted_by_admin_id,
        )

    def to_preview_schema(self) -> DocumentPreviewOut:
        return DocumentPreviewOut(
            id=self.id or "",
            title=self.title,
            category=self._get_category_enum(),
            legalStatus=LegalStatus(self.legal_status),
            legalType=LegalDocumentType(self.legal_type),
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationToTarget=LegalRelationType(self.relation_to_target),
            targetDocumentId=self.target_document_id,
            fileType=self.file_type,
            createdAt=self.created_at,
            extractedText=self.extracted_text or "",
        )

    def to_search_item_schema(
        self,
        snippets: list[str],
        *,
        is_favored: bool | None = None,
    ) -> DocumentSearchItemOut:
        return DocumentSearchItemOut(
            id=self.id or "",
            title=self.title,
            category=self._get_category_enum(),
            issuedAt=self.issued_at,
            legalStatus=LegalStatus(self.legal_status),
            legalType=LegalDocumentType(self.legal_type),
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationToTarget=LegalRelationType(self.relation_to_target),
            targetDocumentId=self.target_document_id,
            createdAt=self.created_at,
            isFavorite=bool(is_favored),
            snippets=snippets,
        )
