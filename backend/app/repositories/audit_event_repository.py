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

    def log_event(
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

    def list_filtered(self, *, query: dict[str, Any], limit: int = 250) -> list[dict[str, Any]]:
        cursor = self.collection.find(query).sort("occurredAt", -1).limit(limit)
        return [self._to_activity(raw) for raw in cursor]

    def count_filtered(self, *, query: dict[str, Any]) -> int:
        return self.collection.count_documents(query)

    def list_for_filters(self, *, limit: int = 500) -> list[dict[str, Any]]:
        cursor = self.collection.find({}, {"userId": 1, "userName": 1, "userEmail": 1, "actionType": 1, "actionLabel": 1}).sort("occurredAt", -1).limit(limit)
        return [dict(raw) for raw in cursor]

    def _to_activity(self, raw: dict[str, Any]) -> dict[str, Any]:
        occurred_at = raw.get("occurredAt")
        if isinstance(occurred_at, datetime):
            occurred_at_str = occurred_at.isoformat()
        else:
            occurred_at_str = str(occurred_at or "")
        return {
            "id": str(raw.get("_id", "")),
            "occurredAt": occurred_at_str,
            "userId": str(raw.get("userId", "")),
            "userName": str(raw.get("userName", "")),
            "userEmail": str(raw.get("userEmail", "")),
            "userRole": str(raw.get("userRole", "")),
            "actionType": str(raw.get("actionType", "")),
            "actionLabel": str(raw.get("actionLabel", "")),
            "category": str(raw.get("category", "")),
            "entityType": str(raw.get("entityType", "")),
            "entityId": str(raw.get("entityId", "")),
            "entityLabel": str(raw.get("entityLabel", "")),
            "summary": str(raw.get("summary", "")),
            "metadata": dict(raw.get("metadata") or {}),
        }
