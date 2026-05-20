from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.repositories import AuditEventRepository, ChatRepository, ReclamationRepository, SessionsRepository, UsersRepository


class ActivityAggregatorService:
    def __init__(
        self,
        audit_event_repository: AuditEventRepository,
        sessions_repository: SessionsRepository,
        reclamation_repository: ReclamationRepository,
        chat_repository: ChatRepository,
        users_repository: UsersRepository,
    ) -> None:
        self.audit_event_repository = audit_event_repository
        self.sessions_repository = sessions_repository
        self.reclamation_repository = reclamation_repository
        self.chat_repository = chat_repository
        self.users_repository = users_repository

    def collect(
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
            *self._build_chat_activities(users_map, limit=limit),
            *self._build_document_search_activities(limit=limit),
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

        return {
            "all_activities": activities,
            "filtered": filtered,
        }

    def _build_users_map(self) -> dict[str, dict[str, str]]:
        users = self.users_repository.list_by_roles(["ADMIN", "FINANCE_USER"])
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

    def _build_chat_activities(
        self,
        users_map: dict[str, dict[str, str]],
        *,
        limit: int,
    ) -> list[dict[str, Any]]:
        conversations = self.chat_repository.list_recent(limit=limit)
        conversation_by_id = {conversation.id or "": conversation for conversation in conversations}
        items: list[dict[str, Any]] = []

        for conversation in conversations:
            user_info = self._resolve_user_info(users_map, user_id=conversation.user_id)
            items.append(
                self._make_activity(
                    activity_id=f"chat:conversation:{conversation.id}:created",
                    occurred_at=conversation.created_at,
                    user_info=user_info,
                    action_type="CHAT_CONVERSATION_CREATED",
                    action_label="Conversation chat",
                    category="Chat",
                    entity_type="CHAT_CONVERSATION",
                    entity_id=conversation.id or "",
                    entity_label=conversation.summary or "Nouvelle discussion",
                    summary=f"{user_info['name']} a demarre une conversation chat.",
                    metadata={
                        "conversation": conversation.summary,
                        "archivee": conversation.is_archived,
                        "supprimeeLe": self._serialize_datetime(conversation.deleted_at),
                    },
                )
            )

        for message in self.chat_repository.list_recent_messages(limit=limit):
            conversation = conversation_by_id.get(message.conversation_id)
            user_info = self._resolve_user_info(
                users_map,
                user_id=conversation.user_id if conversation else "",
            )
            if message.role == "user":
                items.append(
                    self._make_activity(
                        activity_id=f"chat:message:{message.id}:question",
                        occurred_at=message.created_at,
                        user_info=user_info,
                        action_type="CHAT_QUESTION",
                        action_label="Question chat",
                        category="Chat",
                        entity_type="CHAT_MESSAGE",
                        entity_id=message.id or "",
                        entity_label=conversation.summary if conversation else "Message chat",
                        summary=f"{user_info['name']} a pose une question au chat.",
                        metadata={
                            "conversationId": message.conversation_id,
                            "conversation": conversation.summary if conversation else "",
                            "extrait": message.content[:240],
                        },
                    )
                )

            if message.feedback and message.feedback_at:
                feedback_user = self._resolve_user_info(
                    users_map,
                    user_id=message.feedback_user_id or (conversation.user_id if conversation else ""),
                )
                label = "Like chat" if message.feedback == "like" else "Dislike chat"
                items.append(
                    self._make_activity(
                        activity_id=f"chat:message:{message.id}:feedback",
                        occurred_at=message.feedback_at,
                        user_info=feedback_user,
                        action_type=f"CHAT_FEEDBACK_{message.feedback.upper()}",
                        action_label=label,
                        category="Chat",
                        entity_type="CHAT_MESSAGE",
                        entity_id=message.id or "",
                        entity_label=conversation.summary if conversation else "Feedback chat",
                        summary=f"{feedback_user['name']} a donne un avis sur une reponse du chat.",
                        metadata={
                            "conversationId": message.conversation_id,
                            "conversation": conversation.summary if conversation else "",
                            "feedback": message.feedback,
                            "extrait": message.content[:240],
                        },
                    )
                )

        return items

    def _build_document_search_activities(self, *, limit: int) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for raw_event in self.audit_event_repository.list_recent(limit=limit):
            occurred_at = self._coerce_datetime(raw_event.get("occurredAt")) or datetime.now(UTC)
            user_info = {
                "id": str(raw_event.get("userId", "")),
                "name": str(raw_event.get("userName", "")),
                "email": str(raw_event.get("userEmail", "")),
                "role": str(raw_event.get("userRole", "")),
            }
            items.append(
                self._make_activity(
                    activity_id=f"event:{raw_event.get('_id')}",
                    occurred_at=occurred_at,
                    user_info=user_info,
                    action_type=str(raw_event.get("actionType", "DOCUMENT_SEARCH")),
                    action_label=str(raw_event.get("actionLabel", "Recherche document")),
                    category=str(raw_event.get("category", "Recherche document")),
                    entity_type=str(raw_event.get("entityType", "DOCUMENT_SEARCH")),
                    entity_id=str(raw_event.get("entityId", "")),
                    entity_label=str(raw_event.get("entityLabel", "Recherche document")),
                    summary=str(raw_event.get("summary", "")),
                    metadata=dict(raw_event.get("metadata") or {}),
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

    def _build_user_filters(self, items: list[dict[str, Any]]) -> list[dict[str, str]]:
        seen: dict[str, dict[str, str]] = {}
        for item in items:
            user_id = str(item.get("userId", "")).strip()
            if not user_id or user_id == "system" or user_id in seen:
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
        if "prise en charge" in normalized:
            return "RECLAMATION_TAKEN", "Prise en charge reclamation"
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
