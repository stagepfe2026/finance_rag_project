from dataclasses import dataclass, field
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


@dataclass
class DocumentModel:
    title: str
    category: str
    description: str
    document_status: str
    legal_status: str
    document_type: str
    realized_at: datetime | None
    date_publication: datetime | None
    date_entree_vigueur: datetime | None
    version: str
    relation_type: str
    related_document_id: str | None
    file_path: str
    file_size: int
    file_type: str
    created_at: datetime
    is_favored: bool = False
    favorite_user_ids: list[str] = field(default_factory=list)
    deleted_at: datetime | None = None
    indexed_at: datetime | None = None
    chunks_count: int | None = None
    index_error: str | None = None
    id: str | None = None
    content: str | None = None

    @classmethod
    def new_processing(
        cls,
        *,
        title: str,
        category: str,
        description: str,
        legal_status: str,
        document_type: str,
        realized_at: datetime | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        version: str = "",
        relation_type: str = LegalRelationType.none.value,
        related_document_id: str | None = None,
        file_path: str,
        file_size: int,
        file_type: str,
        content: str | None = None,
    ) -> "DocumentModel":
        return cls(
            title=title.strip(),
            category=category,
            description=description.strip(),
            document_status=DocumentStatus.processing.value,
            legal_status=legal_status,
            document_type=document_type,
            realized_at=realized_at,
            date_publication=date_publication,
            date_entree_vigueur=date_entree_vigueur,
            version=version.strip(),
            relation_type=relation_type,
            related_document_id=related_document_id,
            file_path=file_path,
            file_size=file_size,
            file_type=file_type,
            created_at=datetime.now(UTC),
            is_favored=False,
            content=content,
        )

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "DocumentModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            title=str(raw.get("title", "")),
            category=str(raw.get("category", "other")),
            description=str(raw.get("description", "")),
            document_status=str(raw.get("documentStatus", DocumentStatus.processing.value)),
            legal_status=str(raw.get("legalStatus", LegalStatus.inconnu.value)),
            document_type=str(raw.get("documentType", LegalDocumentType.autre.value)),
            realized_at=raw.get("realizedAt"),
            date_publication=raw.get("datePublication"),
            date_entree_vigueur=raw.get("dateEntreeVigueur"),
            version=str(raw.get("version", "")),
            relation_type=str(raw.get("relationType", LegalRelationType.none.value)),
            related_document_id=(
                str(raw.get("relatedDocumentId"))
                if raw.get("relatedDocumentId") is not None
                else None
            ),
            file_path=str(raw.get("filePath", "")),
            file_size=int(raw.get("fileSize", 0)),
            file_type=str(raw.get("fileType", "application/octet-stream")),
            created_at=raw.get("createdAt") or datetime.now(UTC),
            is_favored=False,
            favorite_user_ids=[
                str(item)
                for item in raw.get("favoriteUserIds", [])
                if isinstance(item, str) and item.strip()
            ],
            deleted_at=raw.get("deletedAt"),
            indexed_at=raw.get("indexedAt"),
            chunks_count=raw.get("chunksCount"),
            index_error=raw.get("indexError"),
            content=raw.get("content"),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "category": self.category,
            "description": self.description,
            "documentStatus": self.document_status,
            "legalStatus": self.legal_status,
            "documentType": self.document_type,
            "realizedAt": self.realized_at,
            "datePublication": self.date_publication,
            "dateEntreeVigueur": self.date_entree_vigueur,
            "version": self.version,
            "relationType": self.relation_type,
            "relatedDocumentId": self.related_document_id,
            "filePath": self.file_path,
            "fileSize": self.file_size,
            "fileType": self.file_type,
            "isFavored": self.is_favored,
            "favoriteUserIds": self.favorite_user_ids,
            "createdAt": self.created_at,
            "deletedAt": self.deleted_at,
            "indexedAt": self.indexed_at,
            "chunksCount": self.chunks_count,
            "indexError": self.index_error,
            "content": self.content,
        }

    def to_out_schema(self, *, is_favored: bool | None = None) -> DocumentOut:
        return DocumentOut(
            id=self.id or "",
            title=self.title,
            category=DocumentCategory(self.category),
            description=self.description,
            documentStatus=DocumentStatus(self.document_status),
            legalStatus=LegalStatus(self.legal_status),
            documentType=LegalDocumentType(self.document_type),
            realizedAt=self.realized_at,
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationType=LegalRelationType(self.relation_type),
            relatedDocumentId=self.related_document_id,
            filePath=self.file_path,
            fileSize=self.file_size,
            fileType=self.file_type,
            isFavored=self.is_favored if is_favored is None else is_favored,
            createdAt=self.created_at,
            deletedAt=self.deleted_at,
            indexedAt=self.indexed_at,
            chunksCount=self.chunks_count,
            indexError=self.index_error,
        )

    def to_preview_schema(self) -> DocumentPreviewOut:
        return DocumentPreviewOut(
            id=self.id or "",
            title=self.title,
            category=DocumentCategory(self.category),
            description=self.description,
            legalStatus=LegalStatus(self.legal_status),
            documentType=LegalDocumentType(self.document_type),
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationType=LegalRelationType(self.relation_type),
            relatedDocumentId=self.related_document_id,
            fileType=self.file_type,
            createdAt=self.created_at,
            content=self.content or "",
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
            category=DocumentCategory(self.category),
            description=self.description,
            realizedAt=self.realized_at,
            legalStatus=LegalStatus(self.legal_status),
            documentType=LegalDocumentType(self.document_type),
            datePublication=self.date_publication,
            dateEntreeVigueur=self.date_entree_vigueur,
            version=self.version,
            relationType=LegalRelationType(self.relation_type),
            relatedDocumentId=self.related_document_id,
            createdAt=self.created_at,
            isFavored=self.is_favored if is_favored is None else is_favored,
            snippets=snippets,
        )
