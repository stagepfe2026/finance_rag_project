from pydantic import BaseModel

from app.schemas.document_schema import DocumentOut
from app.schemas.notification_schema import NotificationOut


class UserDashboardOut(BaseModel):
    userName: str
    recentDocuments: list[DocumentOut]
    notifications: list[NotificationOut]


class AdminDashboardSummaryOut(BaseModel):
    documentsIndexed: int
    documentsTotal: int
    reclamationsTotal: int
    reclamationsUrgent: int
    activeUsers: int
    pendingReclamations: int


class AdminDashboardReclamationBreakdownOut(BaseModel):
    pending: int
    inProgress: int
    resolved: int
    urgent: int


class AdminDashboardDocumentBreakdownOut(BaseModel):
    indexed: int
    processing: int
    failed: int


class AdminDashboardTrendPointOut(BaseModel):
    date: str
    label: str
    documents: int
    reclamations: int


class AdminDashboardIndexedDocumentOut(BaseModel):
    id: str
    title: str
    category: str
    documentStatus: str
    createdAt: str
    indexedAt: str | None
    fileType: str
    chunksCount: int | None


class AdminDashboardLatestAccessOut(BaseModel):
    userId: str
    userName: str
    email: str
    role: str
    lastActivityAt: str
    authMethod: str


class AdminDashboardUrgentCaseOut(BaseModel):
    id: str
    ticketNumber: str
    subject: str
    priority: str
    status: str
    userEmail: str
    createdAt: str


class AdminDashboardOut(BaseModel):
    summary: AdminDashboardSummaryOut
    reclamationBreakdown: AdminDashboardReclamationBreakdownOut
    documentBreakdown: AdminDashboardDocumentBreakdownOut
    trend: list[AdminDashboardTrendPointOut]
    recentIndexedDocuments: list[AdminDashboardIndexedDocumentOut]
    latestAccess: list[AdminDashboardLatestAccessOut]
    urgentCases: list[AdminDashboardUrgentCaseOut]
