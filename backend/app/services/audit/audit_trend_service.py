from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.repositories import AuditEventRepository


class AuditTrendService:
    # Initialise le service avec le repository d'evenements d'audit.
    def __init__(self, audit_event_repository: AuditEventRepository) -> None:
        self.audit_event_repository = audit_event_repository

    # Calcule les statistiques globales a partir d'une liste d'activites.
    def build_stats(self, items: list[dict[str, Any]]) -> dict[str, int]:
        now = datetime.now(UTC)
        last_24_hours = now - timedelta(hours=24)
        user_ids = {
            str(item.get("userId", "")).strip()
            for item in items
            if str(item.get("userId", "")).strip()
        }
        return {
            "total": len(items),
            "uniqueUsers": len(user_ids),
            "authActivities": sum(1 for item in items if item.get("category") == "Authentification"),
            "reclamationActivities": sum(1 for item in items if item.get("category") == "Reclamations"),
            "chatActivities": sum(1 for item in items if item.get("category") == "Chat"),
            "documentSearchActivities": sum(
                1
                for item in items
                if item.get("category") in {"Recherche document", "Gestion document"}
            ),
            "last24Hours": sum(
                1
                for item in items
                if self._coerce_datetime(item.get("occurredAt")) and self._coerce_datetime(item.get("occurredAt")) >= last_24_hours
            ),
        }

    # Construit la tendance d'activite par categorie sur les 7 derniers jours.
    def build_trend(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = datetime.now(UTC)
        buckets: dict[str, dict[str, int]] = {}
        for offset in range(6, -1, -1):
            day = (now - timedelta(days=offset)).date()
            buckets[day.isoformat()] = {
                "count": 0,
                "authentification": 0,
                "reclamations": 0,
                "chat": 0,
                "documentSearch": 0,
            }

        for item in items:
            occurred_at = self._coerce_datetime(item.get("occurredAt"))
            if occurred_at is None:
                continue
            day_key = occurred_at.date().isoformat()
            if day_key in buckets:
                buckets[day_key]["count"] += 1
                category = str(item.get("category", ""))
                if category == "Authentification":
                    buckets[day_key]["authentification"] += 1
                elif category == "Reclamations":
                    buckets[day_key]["reclamations"] += 1
                elif category == "Chat":
                    buckets[day_key]["chat"] += 1
                elif category in {"Recherche document", "Gestion document"}:
                    buckets[day_key]["documentSearch"] += 1

        trend: list[dict[str, Any]] = []
        for day_key, count in buckets.items():
            current = datetime.fromisoformat(day_key).replace(tzinfo=UTC)
            trend.append(
                {
                    "date": day_key,
                    "label": current.strftime("%d/%m"),
                    **count,
                }
            )
        return trend

    # Convertit une valeur en datetime UTC, retourne None si invalide.
    def _coerce_datetime(self, value: Any) -> datetime | None:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=UTC)
            return value.astimezone(UTC)
        if isinstance(value, str) and value:
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=UTC)
            return parsed.astimezone(UTC)
        return None
