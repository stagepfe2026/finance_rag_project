from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class DocumentCategory(StrEnum):
    finance = "finance"
    notes = "notes"
    conventions = "conventions"
    recueil = "recueil"
    other = "other"


class DocumentStatus(StrEnum):
    processing = "processing"
    indexed = "indexed"
    failed = "failed"


class LegalStatus(StrEnum):
    actif = "actif"
    futur = "futur"
    remplace = "remplace"
    abroge = "abroge"


class LegalDocumentType(StrEnum):
    loi = "loi"
    decret = "decret"
    arrete = "arrete"
    note = "note"
    circulaire = "circulaire"
    autre = "autre"


class LegalRelationType(StrEnum):
    none = "none"
    remplace = "remplace"
    abroge = "abroge"


class DocumentOut(BaseModel):
    id: str
    title: str = Field(..., min_length=1)
    category: DocumentCategory
    description: str = ""
    documentStatus: DocumentStatus
    legalStatus: LegalStatus = LegalStatus.actif
    documentType: LegalDocumentType = LegalDocumentType.autre
    realizedAt: datetime | None = None
    datePublication: datetime | None = None
    dateEntreeVigueur: datetime | None = None
    version: str = ""
    relationType: LegalRelationType = LegalRelationType.none
    relatedDocumentId: str | None = None
    filePath: str
    fileSize: int
    fileType: str
    isFavored: bool = False
    createdAt: datetime
    deletedAt: datetime | None = None
    indexedAt: datetime | None = None
    chunksCount: int | None = None
    indexError: str | None = None


class DocumentListResponse(BaseModel):
    items: list[DocumentOut]
    total: int


class DocumentPreviewOut(BaseModel):
    id: str
    title: str
    category: DocumentCategory
    description: str = ""
    legalStatus: LegalStatus = LegalStatus.actif
    documentType: LegalDocumentType = LegalDocumentType.autre
    datePublication: datetime | None = None
    dateEntreeVigueur: datetime | None = None
    version: str = ""
    relationType: LegalRelationType = LegalRelationType.none
    relatedDocumentId: str | None = None
    fileType: str
    createdAt: datetime
    content: str


class DocumentSearchItemOut(BaseModel):
    id: str
    title: str
    category: DocumentCategory
    description: str = ""
    realizedAt: datetime | None = None
    legalStatus: LegalStatus = LegalStatus.actif
    documentType: LegalDocumentType = LegalDocumentType.autre
    datePublication: datetime | None = None
    dateEntreeVigueur: datetime | None = None
    version: str = ""
    relationType: LegalRelationType = LegalRelationType.none
    relatedDocumentId: str | None = None
    createdAt: datetime
    isFavored: bool = False
    snippets: list[str] = Field(default_factory=list)


class DocumentSearchResponse(BaseModel):
    items: list[DocumentSearchItemOut]
    total: int


class DocumentActionResponse(BaseModel):
    success: bool = True
    message: str
    data: DocumentOut | None = None
