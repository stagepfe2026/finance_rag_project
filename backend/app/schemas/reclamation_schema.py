from enum import StrEnum

from pydantic import BaseModel, Field


class ReclamationProblemType(StrEnum):
    bug_technique = "BUG_TECHNIQUE"
    probleme_juridique = "PROBLEME_JURIDIQUE"
    erreur_chatbot = "ERREUR_REPONSE_CHATBOT"
    autre = "AUTRE"


class ReclamationPriority(StrEnum):
    low = "LOW"
    normal = "NORMAL"
    high = "HIGH"
    urgent = "URGENT"


class ReclamationStatus(StrEnum):
    pending = "PENDING"
    in_progress = "IN_PROGRESS"
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
    referenceNumber: str
    userId: str
    userEmail: str
    subject: str
    description: str
    issueCategory: ReclamationProblemType
    customIssueCategory: str | None = None
    priority: ReclamationPriority
    status: ReclamationStatus
    attachment: ReclamationAttachmentOut | None = None
    attachmentName: str | None = None
    attachmentPath: str | None = None
    attachmentSize: int | None = None
    attachmentContentType: str | None = None
    adminReply: str | None = None
    adminReplyAt: str | None = None
    repliedByAdminId: str | None = None
    lastAdminActionAt: str | None = None
    lastAdminActorName: str | None = None
    replyAcknowledged: bool
    createdAt: str
    updatedAt: str
    deletedAt: str | None = None
    history: list[ReclamationActivityOut] = Field(default_factory=list)
    takenAt: str | None = None
    takenByAdminName: str | None = None
    slaDeadlineAt: str = ""
    slaStatus: str = "ON_TIME"
    slaRemainingMinutes: int | None = None
    slaDelayMinutes: int | None = None
    isSlaOverdue: bool = False


class ReclamationListResponse(BaseModel):
    items: list[ReclamationOut]
    total: int


class ReclamationResolveRequest(BaseModel):
    adminReply: str = Field(..., min_length=3, max_length=3000)
    status: ReclamationStatus = ReclamationStatus.resolved
