from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime.now(UTC)


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


@dataclass
class ReclamationModel:
    user_id: str
    user_email: str
    ticket_number: str
    subject: str
    description: str
    problem_type: str
    custom_problem_type: str | None
    priority: str
    status: str
    attachment_name: str | None
    attachment_path: str | None
    attachment_size: int | None
    attachment_content_type: str | None
    admin_reply: str | None
    admin_reply_at: datetime | None
    admin_reply_by: str | None
    last_updated_by_admin_at: datetime | None
    last_updated_by_admin_name: str | None
    is_reply_read_by_user: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    deleted_by_user_id: str | None
    activity_log: list[dict[str, Any]]
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "ReclamationModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            user_email=str(raw.get("userEmail", "")),
            ticket_number=str(raw.get("ticketNumber", "")),
            subject=str(raw.get("subject", "")),
            description=str(raw.get("description", "")),
            problem_type=str(raw.get("problemType", "")),
            custom_problem_type=_optional_str(raw.get("customProblemType")),
            priority=str(raw.get("priority", "NORMAL")),
            status=str(raw.get("status", "PENDING")),
            attachment_name=_optional_str(raw.get("attachmentName")),
            attachment_path=_optional_str(raw.get("attachmentPath")),
            attachment_size=int(raw.get("attachmentSize")) if raw.get("attachmentSize") is not None else None,
            attachment_content_type=_optional_str(raw.get("attachmentContentType")),
            admin_reply=_optional_str(raw.get("adminReply")),
            admin_reply_at=_as_utc_datetime(raw.get("adminReplyAt")) if raw.get("adminReplyAt") else None,
            admin_reply_by=_optional_str(raw.get("adminReplyBy")),
            last_updated_by_admin_at=(
                _as_utc_datetime(raw.get("lastUpdatedByAdminAt")) if raw.get("lastUpdatedByAdminAt") else None
            ),
            last_updated_by_admin_name=_optional_str(raw.get("lastUpdatedByAdminName")),
            is_reply_read_by_user=bool(raw.get("isReplyReadByUser", True)),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            updated_at=_as_utc_datetime(raw.get("updatedAt")),
            deleted_at=_as_utc_datetime(raw.get("deletedAt")) if raw.get("deletedAt") else None,
            deleted_by_user_id=_optional_str(raw.get("deletedByUserId")),
            activity_log=[item for item in raw.get("activityLog", []) if isinstance(item, dict)],
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "userEmail": self.user_email,
            "ticketNumber": self.ticket_number,
            "subject": self.subject,
            "description": self.description,
            "problemType": self.problem_type,
            "customProblemType": self.custom_problem_type,
            "priority": self.priority,
            "status": self.status,
            "attachmentName": self.attachment_name,
            "attachmentPath": self.attachment_path,
            "attachmentSize": self.attachment_size,
            "attachmentContentType": self.attachment_content_type,
            "adminReply": self.admin_reply,
            "adminReplyAt": self.admin_reply_at,
            "adminReplyBy": self.admin_reply_by,
            "lastUpdatedByAdminAt": self.last_updated_by_admin_at,
            "lastUpdatedByAdminName": self.last_updated_by_admin_name,
            "isReplyReadByUser": self.is_reply_read_by_user,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "deletedAt": self.deleted_at,
            "deletedByUserId": self.deleted_by_user_id,
            "activityLog": self.activity_log,
        }
