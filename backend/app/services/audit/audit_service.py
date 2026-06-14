from __future__ import annotations

from typing import Any

from app.repositories import AuditEventRepository, UsersRepository
from app.services.audit.audit_logger_service import AuditLoggerService
from app.services.audit.audit_trend_service import AuditTrendService


class AuditService:
    # Initialise le service et cree les index MongoDB necessaires.
    def __init__(self) -> None:
        self._repo = AuditEventRepository()
        self._repo.ensure_indexes()
        self._logger = AuditLoggerService(self._repo)
        self._trend = AuditTrendService(self._repo)
        self._users_repo = UsersRepository()

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    # Retourne les activites filtrees avec statistiques et tendances.
    def get_activities(
        self,
        *,
        user_id: str | None = None,
        action_type: str | None = None,
        search: str | None = None,
        limit: int = 250,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if user_id and user_id.strip():
            query["userId"] = user_id.strip()
        if action_type and action_type.strip():
            query["actionType"] = action_type.strip().upper()
        if search and search.strip():
            s = search.strip()
            query["$or"] = [
                {"summary": {"$regex": s, "$options": "i"}},
                {"entityLabel": {"$regex": s, "$options": "i"}},
            ]

        items = self._repo.list_filtered(query=query, limit=limit)
        total = self._repo.count_filtered(query=query)
        all_items = self._repo.list_for_filters(limit=500)

        users_map = self._build_users_map()
        self._enrich_with_user_info(items, users_map)

        return {
            "items": items,
            "total": total,
            "stats": self._trend.build_stats(items),
            "trend": self._trend.build_trend(items),
            "users": self._build_user_filters(all_items, users_map),
            "actionTypes": self._build_action_type_filters(all_items),
        }

    # ------------------------------------------------------------------
    # Logging — called by routers via try_log_audit()
    # ------------------------------------------------------------------

    # Delegue l'enregistrement d'une action document au logger d'audit.
    def log_document_action(
        self, *, current_user: dict[str, Any], action_type: str, action_label: str,
        entity_type: str, entity_id: str, entity_label: str, summary: str,
        category: str = "Recherche document", metadata: dict[str, Any] | None = None,
    ) -> None:
        self._logger.log_document_action(
            current_user=current_user, action_type=action_type, action_label=action_label,
            entity_type=entity_type, entity_id=entity_id, entity_label=entity_label,
            summary=summary, category=category, metadata=metadata,
        )

    # Delegue l'enregistrement d'un echec de connexion au logger d'audit.
    def log_failed_login(self, *, email: str, reason: str = "INVALID_CREDENTIALS") -> None:
        self._logger.log_failed_login(email=email, reason=reason)

    # Delegue l'enregistrement d'une connexion reussie au logger d'audit.
    def log_login_success(self, *, current_user: dict[str, Any]) -> None:
        self._logger.log_login_success(current_user=current_user)

    # Delegue l'enregistrement d'une deconnexion au logger d'audit.
    def log_logout(self, *, current_user: dict[str, Any]) -> None:
        self._logger.log_logout(current_user=current_user)

    # Delegue l'enregistrement d'un message chat au logger d'audit.
    def log_chat_message(self, *, current_user: dict[str, Any], content: str, conversation_id: str) -> None:
        self._logger.log_chat_message(current_user=current_user, content=content, conversation_id=conversation_id)

    # Delegue l'enregistrement d'une action reclamation au logger d'audit.
    def log_reclamation_action(self, *, current_user: dict[str, Any], action_type: str, action_label: str, reclamation_id: str, subject: str) -> None:
        self._logger.log_reclamation_action(current_user=current_user, action_type=action_type, action_label=action_label, reclamation_id=reclamation_id, subject=subject)

    # Delegue l'enregistrement d'un evenement systeme au logger d'audit.
    def log_system_event(
        self, *, action_type: str, action_label: str, category: str,
        entity_type: str, entity_id: str, entity_label: str, summary: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._logger.log_system_event(
            action_type=action_type, action_label=action_label, category=category,
            entity_type=entity_type, entity_id=entity_id, entity_label=entity_label,
            summary=summary, metadata=metadata,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    # Construit un dictionnaire id -> infos utilisateur pour l'enrichissement.
    def _build_users_map(self) -> dict[str, dict[str, str]]:
        result: dict[str, dict[str, str]] = {}
        for user in self._users_repo.list_all():
            if not user.id:
                continue
            full_name = " ".join(part for part in [user.prenom.strip(), user.nom.strip()] if part).strip()
            result[user.id] = {
                "name": full_name or user.email,
                "email": user.email,
                "role": user.role.value,
            }
        return result

    # Enrichit chaque evenement avec le nom et l'email de l'utilisateur.
    @staticmethod
    def _enrich_with_user_info(items: list[dict[str, Any]], users_map: dict[str, dict[str, str]]) -> None:
        for item in items:
            uid = str(item.get("userId", "")).strip()
            user = users_map.get(uid)
            if user:
                item["userName"] = user["name"]
                item["userEmail"] = user["email"]
                item["userRole"] = user["role"]
            else:
                meta = item.get("metadata") or {}
                item["userEmail"] = str(meta.get("email", ""))
                item["userName"] = item["userEmail"] or uid or "Utilisateur"
                item["userRole"] = ""

    # Construit la liste des utilisateurs distincts pour les filtres de l'UI.
    @staticmethod
    def _build_user_filters(items: list[dict[str, Any]], users_map: dict[str, dict[str, str]]) -> list[dict[str, Any]]:
        seen: dict[str, dict[str, str]] = {}
        for item in items:
            uid = str(item.get("userId", "")).strip()
            if uid and uid != "system" and uid not in seen:
                user = users_map.get(uid)
                label = user["name"] if user else uid
                seen[uid] = {"value": uid, "label": label}
        return sorted(seen.values(), key=lambda x: x["label"])

    # Construit la liste des types d'actions distincts pour les filtres de l'UI.
    @staticmethod
    def _build_action_type_filters(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: dict[str, str] = {}
        for item in items:
            action = str(item.get("actionType", "")).strip()
            label = str(item.get("actionLabel", "")).strip()
            if action and action not in seen:
                seen[action] = label
        return [{"value": k, "label": v} for k, v in sorted(seen.items(), key=lambda x: x[1])]
