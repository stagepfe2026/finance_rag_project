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
    is_reply_read_by_user: bool
    created_at: datetime
    updated_at: datetime
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
            custom_problem_type=(
                str(raw.get("customProblemType", "")).strip() or None
                if raw.get("customProblemType") is not None
                else None
            ),
            priority=str(raw.get("priority", "NORMAL")),
            status=str(raw.get("status", "PENDING")),
            attachment_name=str(raw.get("attachmentName", "")).strip() or None,
            attachment_path=str(raw.get("attachmentPath", "")).strip() or None,
            attachment_size=int(raw.get("attachmentSize")) if raw.get("attachmentSize") is not None else None,
            attachment_content_type=str(raw.get("attachmentContentType", "")).strip() or None,
            admin_reply=str(raw.get("adminReply", "")).strip() or None,
            admin_reply_at=_as_utc_datetime(raw.get("adminReplyAt")) if raw.get("adminReplyAt") else None,
            admin_reply_by=str(raw.get("adminReplyBy", "")).strip() or None,
            is_reply_read_by_user=bool(raw.get("isReplyReadByUser", True)),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            updated_at=_as_utc_datetime(raw.get("updatedAt")),
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
            "isReplyReadByUser": self.is_reply_read_by_user,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "activityLog": self.activity_log,
        }
