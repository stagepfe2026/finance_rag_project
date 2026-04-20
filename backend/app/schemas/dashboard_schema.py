from pydantic import BaseModel

from app.schemas.document_schema import DocumentOut
from app.schemas.notification_schema import NotificationOut


class UserDashboardOut(BaseModel):
    userName: str
    recentDocuments: list[DocumentOut]
    notifications: list[NotificationOut]
