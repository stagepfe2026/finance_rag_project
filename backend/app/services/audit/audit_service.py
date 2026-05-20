from __future__ import annotations

from typing import Any

from app.repositories import AuditEventRepository, ChatRepository, ReclamationRepository, SessionsRepository, UsersRepository
from app.services.audit.activity_aggregator_service import ActivityAggregatorService
from app.services.audit.audit_logger_service import AuditLoggerService
from app.services.audit.audit_trend_service import AuditTrendService


class AuditService:
    def __init__(self) -> None:
        audit_event_repository = AuditEventRepository()
        audit_event_repository.ensure_indexes()

        self._logger = AuditLoggerService(audit_event_repository)
        self._aggregator = ActivityAggregatorService(
            audit_event_repository=audit_event_repository,
            sessions_repository=SessionsRepository(),
            reclamation_repository=ReclamationRepository(),
            chat_repository=ChatRepository(),
            users_repository=UsersRepository(),
        )
        self._trend = AuditTrendService(audit_event_repository)

    # ------------------------------------------------------------------
    # Public interface — routers call via request.app.state.audit_service
    # ------------------------------------------------------------------

    def get_activities(
        self,
        *,
        user_id: str | None = None,
        action_type: str | None = None,
        search: str | None = None,
        limit: int = 250,
    ) -> dict[str, Any]:
        result = self._aggregator.collect(
            user_id=user_id,
            action_type=action_type,
            search=search,
            limit=limit,
        )
        all_activities = result["all_activities"]
        filtered = result["filtered"]
        visible_items = filtered[:limit]

        return {
            "items": visible_items,
            "total": len(filtered),
            "stats": self._trend.build_stats(filtered),
            "trend": self._trend.build_trend(filtered),
            "users": self._aggregator._build_user_filters(all_activities),
            "actionTypes": self._aggregator._build_action_filters(all_activities),
        }

    # ------------------------------------------------------------------
    # Pass-through logging methods — called by other services / routers
    # ------------------------------------------------------------------

    def log_document_action(
        self,
        *,
        current_user: dict[str, Any],
        action_type: str,
        action_label: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        category: str = "Recherche document",
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._logger.log_document_action(
            current_user=current_user,
            action_type=action_type,
            action_label=action_label,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            category=category,
            metadata=metadata,
        )

    def log_failed_login(self, *, email: str, reason: str = "INVALID_CREDENTIALS") -> None:
        self._logger.log_failed_login(email=email, reason=reason)

    def log_system_event(
        self,
        *,
        action_type: str,
        action_label: str,
        category: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._logger.log_system_event(
            action_type=action_type,
            action_label=action_label,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            summary=summary,
            metadata=metadata,
        )
