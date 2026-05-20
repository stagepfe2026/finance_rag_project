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
    reference_number: str
    subject: str
    description: str
    issue_category: str
    custom_issue_category: str | None
    priority: str
    status: str
    attachment_name: str | None
    attachment_path: str | None
    attachment_size: int | None
    attachment_content_type: str | None
    admin_reply: str | None
    admin_reply_at: datetime | None
    replied_by_admin_id: str | None
    last_admin_action_at: datetime | None
    last_admin_actor_name: str | None
    reply_acknowledged: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    deleted_by_user_id: str | None
    history: list[dict[str, Any]]
    id: str | None = None
    first_handled_at: datetime | None = None
    taken_by_admin_id: str | None = None
    taken_by_admin_name: str | None = None
    sla_overdue_notified_at: datetime | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "ReclamationModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            user_email=str(raw.get("userEmail", "")),
            reference_number=str(raw.get("referenceNumber", "")),
            subject=str(raw.get("subject", "")),
            description=str(raw.get("description", "")),
            issue_category=str(raw.get("issueCategory", "")),
            custom_issue_category=_optional_str(raw.get("customIssueCategory")),
            priority=str(raw.get("priority", "NORMAL")),
            status=str(raw.get("status", "PENDING")),
            attachment_name=_optional_str(raw.get("attachmentName")),
            attachment_path=_optional_str(raw.get("attachmentPath")),
            attachment_size=int(raw.get("attachmentSize")) if raw.get("attachmentSize") is not None else None,
            attachment_content_type=_optional_str(raw.get("attachmentContentType")),
            admin_reply=_optional_str(raw.get("adminReply")),
            admin_reply_at=_as_utc_datetime(raw.get("adminReplyAt")) if raw.get("adminReplyAt") else None,
            replied_by_admin_id=_optional_str(raw.get("repliedByAdminId")),
            last_admin_action_at=(
                _as_utc_datetime(raw.get("lastAdminActionAt")) if raw.get("lastAdminActionAt") else None
            ),
            last_admin_actor_name=_optional_str(raw.get("lastAdminActorName")),
            reply_acknowledged=bool(raw.get("replyAcknowledged", False)),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            updated_at=_as_utc_datetime(raw.get("updatedAt")),
            deleted_at=_as_utc_datetime(raw.get("deletedAt")) if raw.get("deletedAt") else None,
            deleted_by_user_id=_optional_str(raw.get("deletedByUserId")),
            history=[item for item in raw.get("history", []) if isinstance(item, dict)],
            first_handled_at=_as_utc_datetime(raw.get("firstHandledAt")) if raw.get("firstHandledAt") else None,
            taken_by_admin_id=_optional_str(raw.get("takenByAdminId")),
            taken_by_admin_name=_optional_str(raw.get("takenByAdminName")),
            sla_overdue_notified_at=(
                _as_utc_datetime(raw.get("slaOverdueNotifiedAt")) if raw.get("slaOverdueNotifiedAt") else None
            ),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "userEmail": self.user_email,
            "referenceNumber": self.reference_number,
            "subject": self.subject,
            "description": self.description,
            "issueCategory": self.issue_category,
            "customIssueCategory": self.custom_issue_category,
            "priority": self.priority,
            "status": self.status,
            "attachmentName": self.attachment_name,
            "attachmentPath": self.attachment_path,
            "attachmentSize": self.attachment_size,
            "attachmentContentType": self.attachment_content_type,
            "adminReply": self.admin_reply,
            "adminReplyAt": self.admin_reply_at,
            "repliedByAdminId": self.replied_by_admin_id,
            "lastAdminActionAt": self.last_admin_action_at,
            "lastAdminActorName": self.last_admin_actor_name,
            "replyAcknowledged": self.reply_acknowledged,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "deletedAt": self.deleted_at,
            "deletedByUserId": self.deleted_by_user_id,
            "history": self.history,
            "firstHandledAt": self.first_handled_at,
            "takenByAdminId": self.taken_by_admin_id,
            "takenByAdminName": self.taken_by_admin_name,
            "slaOverdueNotifiedAt": self.sla_overdue_notified_at,
        }
