from enum import Enum

from pydantic import BaseModel, Field


class ReclamationProblemType(str, Enum):
    bug_technique = "BUG_TECHNIQUE"
    probleme_juridique = "PROBLEME_JURIDIQUE"
    erreur_chatbot = "ERREUR_REPONSE_CHATBOT"
    autre = "AUTRE"


class ReclamationPriority(str, Enum):
    low = "LOW"
    normal = "NORMAL"
    high = "HIGH"


class ReclamationStatus(str, Enum):
    pending = "PENDING"
    resolved = "RESOLVED"
    failed = "FAILED"


class ReclamationActivityOut(BaseModel):
    id: str
    description: str
    actorName: str
    createdAt: str


class ReclamationAttachmentOut(BaseModel):
    name: str
    size: int | None = None
    contentType: str | None = None


class ReclamationOut(BaseModel):
    _id: str
    ticketNumber: str
    userId: str
    userEmail: str
    subject: str
    description: str
    problemType: ReclamationProblemType
    customProblemType: str | None = None
    priority: ReclamationPriority
    status: ReclamationStatus
    attachment: ReclamationAttachmentOut | None = None
    adminReply: str | None = None
    adminReplyAt: str | None = None
    adminReplyBy: str | None = None
    isReplyReadByUser: bool
    createdAt: str
    updatedAt: str
    activityLog: list[ReclamationActivityOut] = Field(default_factory=list)


class ReclamationListResponse(BaseModel):
    items: list[ReclamationOut]
    total: int


class ReclamationResolveRequest(BaseModel):
    adminReply: str = Field(..., min_length=3, max_length=3000)
