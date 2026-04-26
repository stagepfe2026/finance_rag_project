from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from app.repositories import ReclamationRepository, SessionsRepository, UsersRepository


class AuditService:
    def __init__(self) -> None:
        self.sessions_repository = SessionsRepository()
        self.reclamation_repository = ReclamationRepository()
        self.users_repository = UsersRepository()

    def list_activities(
        self,
        *,
        user_id: str | None = None,
        action_type: str | None = None,
        search: str | None = None,
        limit: int = 250,
    ) -> dict[str, Any]:
        normalized_user_id = (user_id or "").strip()
        normalized_action_type = (action_type or "").strip().upper()
        normalized_search = (search or "").strip().lower()
        users_map = self._build_users_map()

        activities = [
            *self._build_session_activities(users_map, limit=limit),
            *self._build_reclamation_activities(users_map, limit=limit),
        ]
        activities.sort(key=lambda item: item["occurredAt"], reverse=True)

        filtered = [
            item
            for item in activities
            if self._matches_filters(
                item,
                user_id=normalized_user_id,
                action_type=normalized_action_type,
                search=normalized_search,
            )
        ]

        visible_items = filtered[:limit]
        return {
            "items": visible_items,
            "total": len(filtered),
            "stats": self._build_stats(filtered),
            "trend": self._build_trend(filtered),
            "users": self._build_user_filters(activities),
            "actionTypes": self._build_action_filters(activities),
        }

    def _build_users_map(self) -> dict[str, dict[str, str]]:
        users = self.users_repository.list_active_by_roles(["ADMIN", "FINANCE_USER"])
        result: dict[str, dict[str, str]] = {}
        for user in users:
            if not user.id:
                continue
            full_name = " ".join(part for part in [user.prenom.strip(), user.nom.strip()] if part).strip()
            result[user.id] = {
                "id": user.id,
                "name": full_name or user.email,
                "email": user.email,
                "role": user.role.value,
            }
        return result

    def _build_session_activities(self, users_map: dict[str, dict[str, str]], *, limit: int) -> list[dict[str, Any]]:
        sessions = self.sessions_repository.list_recent(limit=limit)
        items: list[dict[str, Any]] = []

        for session in sessions:
            user_info = self._resolve_user_info(users_map, user_id=session.user_id)
            items.append(
                self._make_activity(
                    activity_id=f"session:{session.id}:login",
                    occurred_at=session.created_at,
                    user_info=user_info,
                    action_type="USER_LOGIN",
                    action_label="Connexion",
                    category="Authentification",
                    entity_type="SESSION",
                    entity_id=session.id or "",
                    entity_label=f"Session {session.auth_method.upper()}",
                    summary=f"{user_info['name']} s est connecte a la plateforme.",
                    metadata={
                        "methode": session.auth_method,
                        "creeLe": self._serialize_datetime(session.created_at),
                        "derniereActivite": self._serialize_datetime(session.last_activity_at),
                    },
                )
            )

            if session.closed_at is None:
                continue

            action_type, action_label = self._map_session_close_reason(session.close_reason)
            items.append(
                self._make_activity(
                    activity_id=f"session:{session.id}:close",
                    occurred_at=session.closed_at,
                    user_info=user_info,
                    action_type=action_type,
                    action_label=action_label,
                    category="Authentification",
                    entity_type="SESSION",
                    entity_id=session.id or "",
                    entity_label=f"Session {session.auth_method.upper()}",
                    summary=f"{user_info['name']} a termine sa session ({action_label.lower()}).",
                    metadata={
                        "raison": session.close_reason or "-",
                        "fermeeLe": self._serialize_datetime(session.closed_at),
                        "fermeeAvantExpiration": bool(session.closed_before_expiry),
                    },
                )
            )

        return items

    def _build_reclamation_activities(
        self,
        users_map: dict[str, dict[str, str]],
        *,
        limit: int,
    ) -> list[dict[str, Any]]:
        reclamations = self.reclamation_repository.list_for_audit(limit=limit)
        items: list[dict[str, Any]] = []

        for reclamation in reclamations:
            default_user = self._resolve_user_info(
                users_map,
                user_id=reclamation.user_id,
                fallback_name=reclamation.user_email,
                fallback_email=reclamation.user_email,
                fallback_role="FINANCE_USER",
            )

            for raw_activity in reclamation.activity_log:
                description = str(raw_activity.get("description", "")).strip()
                occurred_at = self._coerce_datetime(raw_activity.get("createdAt")) or reclamation.updated_at
                actor_name = str(raw_activity.get("actorName", "")).strip()
                action_type, action_label = self._map_reclamation_activity(description, reclamation.status)
                is_admin_action = action_type in {"RECLAMATION_UPDATED", "RECLAMATION_RESOLVED"}
                user_info = (
                    self._resolve_actor_info(
                        users_map,
                        actor_name=actor_name or reclamation.last_updated_by_admin_name or "Administrateur",
                    )
                    if is_admin_action
                    else default_user
                )

                items.append(
                    self._make_activity(
                        activity_id=f"reclamation:{reclamation.id}:{raw_activity.get('id', '')}",
                        occurred_at=occurred_at,
                        user_info=user_info,
                        action_type=action_type,
                        action_label=action_label,
                        category="Reclamations",
                        entity_type="RECLAMATION",
                        entity_id=reclamation.id or "",
                        entity_label=reclamation.ticket_number,
                        summary=description or f"Activite sur la reclamation {reclamation.ticket_number}.",
                        metadata={
                            "ticket": reclamation.ticket_number,
                            "sujet": reclamation.subject,
                            "priorite": reclamation.priority,
                            "statut": reclamation.status,
                            "utilisateur": default_user["name"],
                            "emailUtilisateur": default_user["email"],
                            "adminTraitant": reclamation.admin_reply_by or reclamation.last_updated_by_admin_name or "",
                            "reponseAdmin": reclamation.admin_reply or "",
                            "supprimeeLe": self._serialize_datetime(reclamation.deleted_at),
                        },
                    )
                )

        return items

    def _matches_filters(
        self,
        item: dict[str, Any],
        *,
        user_id: str,
        action_type: str,
        search: str,
    ) -> bool:
        if user_id and item.get("userId") != user_id:
            return False

        if action_type and item.get("actionType") != action_type:
            return False

        if not search:
            return True

        searchable_parts = [
            str(item.get("summary", "")),
            str(item.get("userName", "")),
            str(item.get("userEmail", "")),
            str(item.get("actionLabel", "")),
            str(item.get("entityLabel", "")),
            str(item.get("category", "")),
        ]
        searchable_parts.extend(
            str(value)
            for value in (item.get("metadata") or {}).values()
            if value is not None
        )
        haystack = " ".join(searchable_parts).lower()
        return search in haystack

    def _build_stats(self, items: list[dict[str, Any]]) -> dict[str, int]:
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
            "last24Hours": sum(
                1
                for item in items
                if self._coerce_datetime(item.get("occurredAt")) and self._coerce_datetime(item.get("occurredAt")) >= last_24_hours
            ),
        }

    def _build_trend(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = datetime.now(UTC)
        buckets: dict[str, int] = defaultdict(int)
        for offset in range(6, -1, -1):
            day = (now - timedelta(days=offset)).date()
            buckets[day.isoformat()] = 0

        for item in items:
            occurred_at = self._coerce_datetime(item.get("occurredAt"))
            if occurred_at is None:
                continue
            day_key = occurred_at.date().isoformat()
            if day_key in buckets:
                buckets[day_key] += 1

        trend: list[dict[str, Any]] = []
        for day_key, count in buckets.items():
            current = datetime.fromisoformat(day_key).replace(tzinfo=UTC)
            trend.append(
                {
                    "date": day_key,
                    "label": current.strftime("%d/%m"),
                    "count": count,
                }
            )
        return trend

    def _build_user_filters(self, items: list[dict[str, Any]]) -> list[dict[str, str]]:
        seen: dict[str, dict[str, str]] = {}
        for item in items:
            user_id = str(item.get("userId", "")).strip()
            if not user_id or user_id in seen:
                continue
            seen[user_id] = {
                "id": user_id,
                "name": str(item.get("userName", "")),
                "email": str(item.get("userEmail", "")),
                "role": str(item.get("userRole", "")),
            }
        return sorted(seen.values(), key=lambda entry: entry["name"].lower())

    def _build_action_filters(self, items: list[dict[str, Any]]) -> list[dict[str, str]]:
        seen: dict[str, dict[str, str]] = {}
        for item in items:
            action_type = str(item.get("actionType", "")).strip()
            if not action_type or action_type in seen:
                continue
            seen[action_type] = {
                "value": action_type,
                "label": str(item.get("actionLabel", action_type)),
            }
        return sorted(seen.values(), key=lambda entry: entry["label"].lower())

    def _resolve_user_info(
        self,
        users_map: dict[str, dict[str, str]],
        *,
        user_id: str,
        fallback_name: str = "",
        fallback_email: str = "",
        fallback_role: str = "",
    ) -> dict[str, str]:
        if user_id and user_id in users_map:
            return users_map[user_id]
        return {
            "id": user_id,
            "name": fallback_name or fallback_email or "Utilisateur",
            "email": fallback_email,
            "role": fallback_role,
        }

    def _resolve_actor_info(self, users_map: dict[str, dict[str, str]], *, actor_name: str) -> dict[str, str]:
        normalized_actor = actor_name.strip().lower()
        for user in users_map.values():
            if not normalized_actor:
                continue
            if user["email"].strip().lower() == normalized_actor:
                return user
            if user["name"].strip().lower() == normalized_actor:
                return user
        return {
            "id": "",
            "name": actor_name or "Administrateur",
            "email": "",
            "role": "ADMIN",
        }

    def _make_activity(
        self,
        *,
        activity_id: str,
        occurred_at: datetime,
        user_info: dict[str, str],
        action_type: str,
        action_label: str,
        category: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "id": activity_id,
            "occurredAt": self._serialize_datetime(occurred_at),
            "userId": user_info.get("id", ""),
            "userName": user_info.get("name", ""),
            "userEmail": user_info.get("email", ""),
            "userRole": user_info.get("role", ""),
            "actionType": action_type,
            "actionLabel": action_label,
            "category": category,
            "entityType": entity_type,
            "entityId": entity_id,
            "entityLabel": entity_label,
            "summary": summary,
            "metadata": metadata,
        }

    def _map_session_close_reason(self, close_reason: str | None) -> tuple[str, str]:
        normalized = (close_reason or "").strip().upper()
        mapping = {
            "USER_LOGOUT": ("USER_LOGOUT", "Deconnexion"),
            "LOGIN_ROTATION": ("SESSION_ROTATED", "Rotation de session"),
            "SESSION_IDLE_TIMEOUT": ("SESSION_EXPIRED", "Session expiree"),
            "SESSION_MAX_DURATION_EXPIRED": ("SESSION_EXPIRED", "Session expiree"),
            "REFRESH_TOKEN_EXPIRED": ("SESSION_EXPIRED", "Session expiree"),
        }
        return mapping.get(normalized, ("SESSION_CLOSED", "Fermeture de session"))

    def _map_reclamation_activity(self, description: str, status: str) -> tuple[str, str]:
        normalized = description.lower()
        if "supprimee" in normalized:
            return "RECLAMATION_DELETED", "Suppression reclamation"
        if "mise a jour par l administrateur" in normalized:
            if status == "RESOLVED":
                return "RECLAMATION_RESOLVED", "Traitement reclamation"
            return "RECLAMATION_UPDATED", "Mise a jour reclamation"
        if "creee" in normalized:
            return "RECLAMATION_CREATED", "Creation reclamation"
        return "RECLAMATION_EVENT", "Activite reclamation"

    def _serialize_datetime(self, value: datetime | None) -> str | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC).isoformat()
        return value.astimezone(UTC).isoformat()

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
