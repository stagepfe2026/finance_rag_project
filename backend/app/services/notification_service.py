from collections import defaultdict
from datetime import datetime, timezone

from fastapi import WebSocket

from app.core.config import settings
from app.core.security import hash_session_token
from app.models.document_model import DocumentModel
from app.models.notification_model import NotificationModel
from app.models.reclamation_model import ReclamationModel
from app.repositories.audit_event_repository import AuditEventRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.sessions_repository import SessionsRepository
from app.repositories.users_repository import UsersRepository


class NotificationConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        sockets = self._connections.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(user_id, None)

    async def broadcast_to_user(self, user_id: str, payload: dict) -> None:
        sockets = list(self._connections.get(user_id, set()))
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                self.disconnect(user_id, socket)


class NotificationService:
    def __init__(self, manager: NotificationConnectionManager):
        self.manager = manager
        self.repository = NotificationRepository()
        self.audit_event_repository = AuditEventRepository()
        self.users_repository = UsersRepository()
        self.sessions_repository = SessionsRepository()

    def ensure_indexes(self) -> None:
        self.repository.ensure_indexes()

    def list_notifications(self, current_user: dict, *, limit: int = 20) -> dict:
        user_id = str(current_user.get("id", "")).strip()
        items = self.repository.list_for_user(user_id, limit=limit)
        serialized = [self.serialize_notification(item) for item in items]
        return {"items": serialized, "total": len(serialized)}

    def mark_as_read(self, current_user: dict, notification_id: str) -> dict:
        user_id = str(current_user.get("id", "")).strip()
        notification = self.repository.mark_as_read(notification_id, user_id)
        if notification is None:
            raise ValueError("NOTIFICATION_NOT_FOUND")
        return self.serialize_notification(notification)

    async def notify_document_indexed(self, document: DocumentModel) -> None:
        users = self.users_repository.list_active_by_roles(["FINANCE_USER"])
        created_at = document.indexed_at or datetime.now(timezone.utc)
        notifications = [
            NotificationModel(
                user_id=user.id or "",
                type="document_indexed",
                title="Nouveau document indexe",
                description=f"{document.title} est maintenant disponible dans la base documentaire.",
                link="/user/documents/recherche",
                is_read=False,
                created_at=created_at,
            )
            for user in users
            if user.id
        ]
        await self._store_and_emit(notifications)

    async def notify_reclamation_updated(self, reclamation: ReclamationModel, admin_name: str) -> None:
        if not reclamation.user_id:
            return

        status_label = {
            "PENDING": "en attente",
            "IN_PROGRESS": "en cours",
            "RESOLVED": "traitee",
        }.get(reclamation.status, "mise a jour")

        notification = NotificationModel(
            user_id=reclamation.user_id,
            type="reclamation_updated",
            title="Reclamation mise a jour",
            description=(
                f"La reclamation numero {reclamation.ticket_number} est {status_label} "
                f"apres reponse de {admin_name}."
            ),
            link="/user/reclamations",
            is_read=False,
            created_at=reclamation.updated_at,
        )
        await self._store_and_emit([notification])

    async def notify_urgent_reclamation(self, reclamation: "ReclamationModel") -> None:
        admins = self.users_repository.list_active_by_roles(["ADMIN"])
        notifications = [
            NotificationModel(
                user_id=admin.id or "",
                type="urgent_reclamation",
                title="Reclamation urgente recue",
                description=(
                    f"Ticket {reclamation.ticket_number} — {reclamation.subject[:80]}"
                ),
                link="/admin/reclamations",
                is_read=False,
                created_at=reclamation.created_at,
            )
            for admin in admins
            if admin.id
        ]
        await self._store_and_emit(notifications)
        self._record_notification_audit(
            action_type="URGENT_RECLAMATION_NOTIFICATION_SENT",
            action_label="Notification reclamation urgente",
            entity_type="RECLAMATION",
            entity_id=reclamation.id or "",
            entity_label=reclamation.ticket_number,
            summary=f"Notification de reclamation urgente envoyee pour {reclamation.ticket_number}.",
            metadata={
                "ticket": reclamation.ticket_number,
                "priorite": reclamation.priority,
                "destinataires": len(notifications),
            },
        )

    async def notify_sla_overdue(self, reclamation: "ReclamationModel") -> None:
        admins = self.users_repository.list_active_by_roles(["ADMIN"])
        now = datetime.now(timezone.utc)
        notifications = [
            NotificationModel(
                user_id=admin.id or "",
                type="sla_overdue",
                title="SLA depasse",
                description=(
                    f"SLA depasse pour la reclamation {reclamation.ticket_number} — {reclamation.subject[:60]}"
                ),
                link="/admin/reclamations",
                is_read=False,
                created_at=now,
            )
            for admin in admins
            if admin.id
        ]
        await self._store_and_emit(notifications)
        self._record_notification_audit(
            action_type="SLA_OVERDUE_NOTIFICATION_SENT",
            action_label="Notification SLA depasse",
            entity_type="RECLAMATION",
            entity_id=reclamation.id or "",
            entity_label=reclamation.ticket_number,
            summary=f"Notification SLA depasse envoyee pour la reclamation {reclamation.ticket_number}.",
            metadata={
                "ticket": reclamation.ticket_number,
                "priorite": reclamation.priority,
                "destinataires": len(notifications),
            },
        )

    async def notify_indexation_failed(self, document_title: str, error: str) -> None:
        admins = self.users_repository.list_active_by_roles(["ADMIN"])
        now = datetime.now(timezone.utc)
        notifications = [
            NotificationModel(
                user_id=admin.id or "",
                type="indexation_failed",
                title="Echec d indexation",
                description=f"Le document « {document_title[:80]} » n a pas pu etre indexe : {error[:120]}",
                link="/admin/documents",
                is_read=False,
                created_at=now,
            )
            for admin in admins
            if admin.id
        ]
        await self._store_and_emit(notifications)
        self._record_notification_audit(
            action_type="INDEXATION_FAILED_NOTIFICATION_SENT",
            action_label="Notification echec indexation",
            entity_type="DOCUMENT",
            entity_id="",
            entity_label=document_title,
            summary=f"Notification d echec d indexation envoyee pour {document_title}.",
            metadata={
                "titre": document_title,
                "erreur": error[:200],
                "destinataires": len(notifications),
            },
        )

    async def notify_document_deprecated_for_favorites(
        self, deprecated_document: "DocumentModel", new_document_title: str
    ) -> None:
        """Notify users who favorited a document that has been replaced/abrogated."""
        favorite_user_ids = list(deprecated_document.favorite_user_ids or [])
        if not favorite_user_ids:
            return
        now = datetime.now(timezone.utc)
        notifications = [
            NotificationModel(
                user_id=uid,
                type="document_deprecated",
                title="Document mis a jour",
                description=(
                    f"Le document « {deprecated_document.title[:60]} » que vous avez en favoris "
                    f"a ete remplace par « {new_document_title[:60]} »."
                ),
                link="/user/documents/recherche",
                is_read=False,
                created_at=now,
            )
            for uid in favorite_user_ids
        ]
        await self._store_and_emit(notifications)
        self._record_notification_audit(
            action_type="DOCUMENT_DEPRECATED_NOTIFICATION_SENT",
            action_label="Notification document remplace",
            entity_type="DOCUMENT",
            entity_id=deprecated_document.id or "",
            entity_label=deprecated_document.title,
            summary=f"Notification de document favori remplace envoyee pour {deprecated_document.title}.",
            metadata={
                "documentId": deprecated_document.id or "",
                "titre": deprecated_document.title,
                "nouveauDocument": new_document_title,
                "destinataires": len(notifications),
            },
        )

    def authenticate_websocket_user(self, websocket: WebSocket) -> dict | None:
        raw_token = websocket.cookies.get(settings.auth_session_cookie_name)
        if not raw_token:
            return None

        token_hash = hash_session_token(raw_token)
        session = self.sessions_repository.get_active_session_by_token_hash(token_hash)
        if session is None:
            return None

        now = datetime.now(timezone.utc)
        if session.absolute_expires_at <= now or session.refresh_expires_at <= now or session.idle_expires_at <= now:
            return None

        user = self.users_repository.find_active_by_id(session.user_id)
        return user.to_public_dict() if user else None

    def serialize_notification(self, notification: NotificationModel) -> dict:
        return {
            "id": notification.id or "",
            "type": notification.type,
            "title": notification.title,
            "description": notification.description,
            "link": notification.link,
            "isRead": notification.is_read,
            "createdAt": notification.created_at.isoformat(),
        }

    async def _store_and_emit(self, notifications: list[NotificationModel]) -> None:
        created = self.repository.create_many(notifications)
        for item in created:
            if item.user_id:
                await self.manager.broadcast_to_user(
                    item.user_id,
                    {"event": "notification.created", "data": self.serialize_notification(item)},
                )

    def _record_notification_audit(
        self,
        *,
        action_type: str,
        action_label: str,
        entity_type: str,
        entity_id: str,
        entity_label: str,
        summary: str,
        metadata: dict,
    ) -> None:
        try:
            self.audit_event_repository.record(
                user_id="system",
                user_name="Systeme",
                user_email="",
                user_role="SYSTEM",
                action_type=action_type,
                action_label=action_label,
                category="Notifications",
                entity_type=entity_type,
                entity_id=entity_id,
                entity_label=entity_label,
                summary=summary,
                metadata=metadata,
            )
        except Exception:
            pass
