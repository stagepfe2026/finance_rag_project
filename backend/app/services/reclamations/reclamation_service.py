from datetime import UTC, datetime
from uuid import uuid4

from app.models.reclamation_model import ReclamationModel
from app.repositories.reclamation_repository import ReclamationRepository
from app.services.notifications.notification_service import NotificationService
from app.services.reclamations.reclamation_attachment_service import ReclamationAttachmentService
from app.services.reclamations.reclamation_sla_service import ReclamationSlaService
from fastapi import UploadFile


class ReclamationService:
    allowed_problem_types = {
        "BUG_TECHNIQUE",
        "PROBLEME_JURIDIQUE",
        "ERREUR_REPONSE_CHATBOT",
        "AUTRE",
    }
    allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT"}
    allowed_admin_statuses = {"PENDING", "IN_PROGRESS", "RESOLVED"}

    # Initialise le service avec les sous-services et le service de notifications.
    def __init__(self, notification_service: NotificationService | None = None) -> None:
        self.repository = ReclamationRepository()
        self.notification_service = notification_service
        self.attachment_service = ReclamationAttachmentService()
        self.sla_service = ReclamationSlaService()

    # Cree les index MongoDB necessaires aux reclamations.
    def ensure_indexes(self) -> None:
        self.repository.ensure_indexes()

    # Valide et cree une nouvelle reclamation avec piece jointe optionnelle.
    async def create_reclamation(
        self,
        *,
        current_user: dict,
        subject: str,
        description: str,
        problem_type: str,
        custom_problem_type: str | None,
        priority: str,
        attachment: UploadFile | None,
    ) -> dict:
        normalized_subject = " ".join(subject.split()).strip()
        normalized_description = description.strip()
        normalized_problem_type = problem_type.strip().upper()
        normalized_custom_problem_type = " ".join((custom_problem_type or "").split()).strip() or None
        normalized_priority = priority.strip().upper()

        if len(normalized_subject) < 3:
            raise ValueError("SUBJECT_TOO_SHORT")
        if len(normalized_subject) > 160:
            raise ValueError("SUBJECT_TOO_LONG")
        if len(normalized_description) < 10:
            raise ValueError("DESCRIPTION_TOO_SHORT")
        if len(normalized_description) > 3000:
            raise ValueError("DESCRIPTION_TOO_LONG")
        if normalized_problem_type not in self.allowed_problem_types:
            raise ValueError("INVALID_PROBLEM_TYPE")
        if normalized_priority not in self.allowed_priorities:
            raise ValueError("INVALID_PRIORITY")
        if normalized_problem_type == "AUTRE" and not normalized_custom_problem_type:
            raise ValueError("CUSTOM_PROBLEM_TYPE_REQUIRED")
        if normalized_problem_type != "AUTRE":
            normalized_custom_problem_type = None

        attachment_payload = None
        if attachment and attachment.filename:
            attachment_payload = await self.attachment_service.store_attachment(attachment)

        now = datetime.now(UTC)
        ticket_number = self._build_ticket_number(now)
        user_id = str(current_user.get("id", "")).strip()

        reclamation = ReclamationModel(
            user_id=user_id,
            reference_number=ticket_number,
            subject=normalized_subject,
            description=normalized_description,
            issue_category=normalized_problem_type,
            custom_issue_category=normalized_custom_problem_type,
            priority=normalized_priority,
            status="PENDING",
            attachment_name=attachment_payload["name"] if attachment_payload else None,
            attachment_path=attachment_payload["path"] if attachment_payload else None,
            attachment_size=attachment_payload["size"] if attachment_payload else None,
            attachment_content_type=attachment_payload["content_type"] if attachment_payload else None,
            admin_reply=None,
            admin_reply_at=None,
            replied_by_admin_id=None,
            reply_acknowledged=True,
            created_at=now,
            updated_at=now,
            deleted_at=None,
            deleted_by_user_id=None,
            history=[
                {
                    "id": uuid4().hex,
                    "description": "Reclamation creee",
                    "actorName": str(current_user.get("email", user_id)).lower().strip(),
                    "createdAt": now,
                }
            ],
        )

        created = self.repository.create(reclamation)

        if normalized_priority == "URGENT" and self.notification_service is not None:
            await self.notification_service.notify_urgent_reclamation(created)

        return self._serialize_reclamation(created)

    # Retourne la liste des reclamations selon le role de l'utilisateur courant.
    async def list_reclamations(self, current_user: dict) -> dict:
        if current_user.get("role") == "ADMIN":
            reclamations = self.repository.list_all()
            if self.notification_service is not None:
                for rec in reclamations:
                    sla = self.sla_service.compute_sla(rec)
                    if sla["slaStatus"] == "OVERDUE" and rec.sla_overdue_notified_at is None:
                        await self.notification_service.alert_sla_breach(rec)
                        self.repository.record_sla_alert_sent(rec.id)
                        rec.sla_overdue_notified_at = datetime.now(UTC)
        else:
            user_id = str(current_user.get("id", "")).strip()
            reclamations = self.repository.list_for_user(user_id)
        return {
            "items": [self._serialize_reclamation(item) for item in reclamations],
            "total": len(reclamations),
        }

    # Retourne une reclamation par son ID apres verification des droits d'acces.
    def get_reclamation(self, current_user: dict, reclamation_id: str) -> dict:
        if current_user.get("role") == "ADMIN":
            reclamation = self.repository.get_by_id(reclamation_id)
            if reclamation is not None and reclamation.deleted_at is not None:
                reclamation = None
        else:
            user_id = str(current_user.get("id", "")).strip()
            reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        return self._serialize_reclamation(reclamation)

    # Marque la reponse admin d'une reclamation comme lue par l'utilisateur.
    def mark_reply_read(self, current_user: dict, reclamation_id: str) -> dict:
        if current_user.get("role") == "ADMIN":
            reclamation = self.repository.get_by_id(reclamation_id)
            if reclamation is not None and reclamation.deleted_at is not None:
                reclamation = None
            if reclamation is None:
                raise ValueError("RECLAMATION_NOT_FOUND")
            return self._serialize_reclamation(reclamation)

        user_id = str(current_user.get("id", "")).strip()
        reclamation = self.repository.acknowledge_reply(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        return self._serialize_reclamation(reclamation)

    # Retourne le chemin et le type MIME de la piece jointe d'une reclamation.
    def get_reclamation_attachment_response_data(self, current_user: dict, reclamation_id: str) -> tuple:
        if current_user.get("role") == "ADMIN":
            reclamation = self.repository.get_by_id(reclamation_id)
            if reclamation is not None and reclamation.deleted_at is not None:
                reclamation = None
        else:
            user_id = str(current_user.get("id", "")).strip()
            reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")

        return self.attachment_service.get_attachment_file_data(
            reclamation.attachment_path,
            reclamation.attachment_content_type,
        )

    # Assigne une reclamation en attente a un administrateur.
    async def take_reclamation(self, admin_user: dict, reclamation_id: str) -> dict:
        admin_id = str(admin_user.get("id", "")).strip()
        admin_name = " ".join(
            part
            for part in [str(admin_user.get("prenom", "")).strip(), str(admin_user.get("nom", "")).strip()]
            if part
        ).strip() or str(admin_user.get("email", "")).strip() or "Administrateur"

        reclamation = self.repository.get_by_id(reclamation_id)
        if reclamation is None or reclamation.deleted_at is not None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        if reclamation.status != "PENDING":
            raise ValueError("RECLAMATION_ALREADY_HANDLED")

        updated = self.repository.assign_to_admin(reclamation_id, admin_id, admin_name)
        if updated is None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        return self._serialize_reclamation(updated)

    # Supprime une reclamation en attente appartenant a l'utilisateur courant.
    def delete_reclamation(self, current_user: dict, reclamation_id: str) -> None:
        user_id = str(current_user.get("id", "")).strip()
        reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")

        if reclamation.status != "PENDING":
            raise ValueError("RECLAMATION_DELETE_NOT_ALLOWED")

        deleted = self.repository.delete_for_user(reclamation_id, user_id)
        if not deleted:
            raise ValueError("RECLAMATION_NOT_FOUND")

    # Valide et met a jour une reclamation en attente de l'utilisateur courant.
    async def update_reclamation(
        self,
        *,
        current_user: dict,
        reclamation_id: str,
        subject: str,
        description: str,
        problem_type: str,
        custom_problem_type: str | None,
        priority: str,
        attachment: UploadFile | None,
    ) -> dict:
        user_id = str(current_user.get("id", "")).strip()
        reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        if reclamation.status != "PENDING":
            raise ValueError("RECLAMATION_UPDATE_NOT_ALLOWED")

        normalized_subject = " ".join(subject.split()).strip()
        normalized_description = description.strip()
        normalized_problem_type = problem_type.strip().upper()
        normalized_custom_problem_type = " ".join((custom_problem_type or "").split()).strip() or None
        normalized_priority = priority.strip().upper()

        if len(normalized_subject) < 3:
            raise ValueError("SUBJECT_TOO_SHORT")
        if len(normalized_subject) > 160:
            raise ValueError("SUBJECT_TOO_LONG")
        if len(normalized_description) < 10:
            raise ValueError("DESCRIPTION_TOO_SHORT")
        if len(normalized_description) > 3000:
            raise ValueError("DESCRIPTION_TOO_LONG")
        if normalized_problem_type not in self.allowed_problem_types:
            raise ValueError("INVALID_PROBLEM_TYPE")
        if normalized_priority not in self.allowed_priorities:
            raise ValueError("INVALID_PRIORITY")
        if normalized_problem_type == "AUTRE" and not normalized_custom_problem_type:
            raise ValueError("CUSTOM_PROBLEM_TYPE_REQUIRED")
        if normalized_problem_type != "AUTRE":
            normalized_custom_problem_type = None

        attachment_payload = None
        if attachment and attachment.filename:
            attachment_payload = await self.attachment_service.store_attachment(attachment)

        updated = self.repository.edit_for_user(
            reclamation_id,
            user_id,
            subject=normalized_subject,
            description=normalized_description,
            issue_category=normalized_problem_type,
            custom_issue_category=normalized_custom_problem_type,
            priority=normalized_priority,
            attachment_payload=attachment_payload,
        )
        if updated is None:
            raise ValueError("RECLAMATION_UPDATE_NOT_ALLOWED")
        return self._serialize_reclamation(updated)

    # Enregistre la reponse admin et change le statut d'une reclamation en cours.
    async def resolve_reclamation(self, reclamation_id: str, *, admin_user: dict, admin_reply: str, status: str) -> dict:
        normalized_reply = admin_reply.strip()
        normalized_status = status.strip().upper()
        if len(normalized_reply) < 3:
            raise ValueError("ADMIN_REPLY_TOO_SHORT")
        if normalized_status not in self.allowed_admin_statuses:
            raise ValueError("INVALID_ADMIN_STATUS")

        reclamation = self.repository.get_by_id(reclamation_id)
        if reclamation is None or reclamation.deleted_at is not None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        if reclamation.status != "IN_PROGRESS":
            raise ValueError("RECLAMATION_NOT_IN_PROGRESS")
        if reclamation.admin_reply_at is not None or (reclamation.admin_reply or "").strip():
            raise ValueError("RECLAMATION_ALREADY_RESOLVED_BY_ADMIN")

        admin_name = " ".join(
            part
            for part in [str(admin_user.get("prenom", "")).strip(), str(admin_user.get("nom", "")).strip()]
            if part
        ).strip() or str(admin_user.get("email", "")).strip() or "Administrateur"

        updated = self.repository.save_admin_reply(
            reclamation_id,
            admin_reply=normalized_reply,
            replied_by_admin_id=admin_name,
            status=normalized_status,
        )
        if updated is None:
            raise ValueError("RECLAMATION_NOT_FOUND")

        if self.notification_service is not None:
            await self.notification_service.notify_reclamation_updated(updated, admin_name)

        return self._serialize_reclamation(updated)

    # Genere un numero de ticket unique base sur la date et un identifiant aleatoire.
    def _build_ticket_number(self, now: datetime) -> str:
        return f"REC-{now.strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"

    # Serialise un objet ReclamationModel en dictionnaire JSON avec le calcul SLA.
    def _serialize_reclamation(self, reclamation: ReclamationModel) -> dict:
        attachment = None
        if reclamation.attachment_name:
            attachment = {
                "name": reclamation.attachment_name,
                "size": reclamation.attachment_size,
                "contentType": reclamation.attachment_content_type,
                "url": f"/api/reclamations/{reclamation.id}/attachment" if reclamation.id else None,
            }

        sla = self.sla_service.compute_sla(reclamation)

        return {
            "_id": reclamation.id,
            "referenceNumber": reclamation.reference_number,
            "userId": reclamation.user_id,
            "subject": reclamation.subject,
            "description": reclamation.description,
            "issueCategory": reclamation.issue_category,
            "customIssueCategory": reclamation.custom_issue_category,
            "priority": reclamation.priority,
            "status": reclamation.status,
            "attachmentName": reclamation.attachment_name,
            "attachmentPath": reclamation.attachment_path,
            "attachmentSize": reclamation.attachment_size,
            "attachmentContentType": reclamation.attachment_content_type,
            "attachment": attachment,
            "adminReply": reclamation.admin_reply,
            "adminReplyAt": reclamation.admin_reply_at.isoformat() if reclamation.admin_reply_at else None,
            "repliedByAdminId": reclamation.replied_by_admin_id,
            "replyAcknowledged": reclamation.reply_acknowledged,
            "createdAt": reclamation.created_at.isoformat(),
            "updatedAt": reclamation.updated_at.isoformat(),
            "deletedAt": reclamation.deleted_at.isoformat() if reclamation.deleted_at else None,
            "history": [
                {
                    "id": str(item.get("id", "")),
                    "description": str(item.get("description", "")),
                    "actorName": str(item.get("actorName", "")),
                    "createdAt": self._serialize_datetime(item.get("createdAt")),
                }
                for item in reclamation.history
            ],
            "takenAt": reclamation.first_handled_at.isoformat() if reclamation.first_handled_at else None,
            "takenByAdminName": reclamation.taken_by_admin_name,
            **sla,
        }

    # Convertit une valeur en chaine ISO 8601 UTC, retourne l'heure courante si invalide.
    def _serialize_datetime(self, value: object) -> str:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=UTC).isoformat()
            return value.astimezone(UTC).isoformat()
        return datetime.now(UTC).isoformat()
