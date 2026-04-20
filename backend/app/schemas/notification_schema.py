from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    description: str
    link: str | None = None
    isRead: bool
    createdAt: str


class NotificationListResponse(BaseModel):
    items: list[NotificationOut]
    total: int
