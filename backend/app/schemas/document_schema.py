from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class DocumentCategory(StrEnum):
    finance = "finance"
    legal = "legal"
    hr = "hr"
    compliance = "compliance"
    other = "other"


class DocumentStatus(StrEnum):
    processing = "processing"
    indexed = "indexed"
    failed = "failed"


class DocumentOut(BaseModel):
    id: str
    title: str = Field(..., min_length=1)
    category: DocumentCategory
    description: str = ""
    documentStatus: DocumentStatus
    realizedAt: datetime | None = None
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
    fileType: str
    createdAt: datetime
    content: str


class DocumentActionResponse(BaseModel):
    success: bool = True
    message: str
    data: DocumentOut | None = None
