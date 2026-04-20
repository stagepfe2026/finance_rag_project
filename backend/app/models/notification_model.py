from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime.now(UTC)


@dataclass
class NotificationModel:
    user_id: str
    type: str
    title: str
    description: str
    link: str | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "NotificationModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            type=str(raw.get("type", "system")),
            title=str(raw.get("title", "")),
            description=str(raw.get("description", "")),
            link=str(raw.get("link", "")).strip() or None,
            is_read=bool(raw.get("isRead", False)),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            read_at=_as_utc_datetime(raw.get("readAt")) if raw.get("readAt") else None,
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "link": self.link,
            "isRead": self.is_read,
            "createdAt": self.created_at,
            "readAt": self.read_at,
        }
