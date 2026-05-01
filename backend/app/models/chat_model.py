from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime.now(UTC)


@dataclass
class ConversationModel:
    user_id: str
    summary: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False
    archived_at: datetime | None = None
    deleted_at: datetime | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "ConversationModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            summary=str(raw.get("summary", "Nouvelle discussion")),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            updated_at=_as_utc_datetime(raw.get("updatedAt")),
            is_archived=bool(raw.get("isArchived", False)),
            archived_at=_as_utc_datetime(raw.get("archivedAt")) if raw.get("archivedAt") else None,
            deleted_at=_as_utc_datetime(raw.get("deletedAt")) if raw.get("deletedAt") else None,
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "summary": self.summary,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "isArchived": self.is_archived,
            "archivedAt": self.archived_at,
            "deletedAt": self.deleted_at,
        }


@dataclass
class ChatMessageModel:
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    sources: list[dict[str, Any]] = field(default_factory=list)
    feedback: str | None = None
    feedback_at: datetime | None = None
    feedback_user_id: str | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "ChatMessageModel":
        raw_sources = raw.get("sources")
        normalized_sources = raw_sources if isinstance(raw_sources, list) else []
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            conversation_id=str(raw.get("conversationId", "")),
            role=str(raw.get("role", "assistant")),
            content=str(raw.get("content", "")),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            sources=[item for item in normalized_sources if isinstance(item, dict)],
            feedback=str(raw.get("feedback")) if raw.get("feedback") in {"like", "dislike"} else None,
            feedback_at=_as_utc_datetime(raw.get("feedbackAt")) if raw.get("feedbackAt") else None,
            feedback_user_id=str(raw.get("feedbackUserId")) if raw.get("feedbackUserId") else None,
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "conversationId": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "createdAt": self.created_at,
            "sources": self.sources,
            "feedback": self.feedback,
            "feedbackAt": self.feedback_at,
            "feedbackUserId": self.feedback_user_id,
        }
