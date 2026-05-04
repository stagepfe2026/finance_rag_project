from datetime import UTC, datetime
from typing import Any

from app.core.database import get_audit_events_collection


class AuditEventRepository:
    def __init__(self) -> None:
        self.collection = get_audit_events_collection()

    def ensure_indexes(self) -> None:
        self.collection.create_index([("occurredAt", -1)])
        self.collection.create_index([("category", 1), ("actionType", 1)])
        self.collection.create_index([("userId", 1), ("occurredAt", -1)])

    def record(
        self,
        *,
        occurred_at: datetime | None = None,
        user_id: str,
        user_name: str,
        user_email: str,
        user_role: str,
        action_type: str,
        action_label: str,
        category: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        now = occurred_at or datetime.now(UTC)
        if now.tzinfo is None:
            now = now.replace(tzinfo=UTC)
        else:
            now = now.astimezone(UTC)

        self.collection.insert_one(
            {
                "occurredAt": now,
                "userId": user_id,
                "userName": user_name,
                "userEmail": user_email,
                "userRole": user_role,
                "actionType": action_type,
                "actionLabel": action_label,
                "category": category,
                "entityType": entity_type,
                "entityId": entity_id,
                "entityLabel": entity_label,
                "summary": summary,
                "metadata": metadata or {},
            }
        )

    def list_recent(self, *, limit: int = 250) -> list[dict[str, Any]]:
        cursor = self.collection.find({}).sort("occurredAt", -1).limit(limit)
        return [dict(raw) for raw in cursor]
