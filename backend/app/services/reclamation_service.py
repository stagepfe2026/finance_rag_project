import re
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.models.reclamation_model import ReclamationModel
from app.repositories.reclamation_repository import ReclamationRepository
from app.services.notification_service import NotificationService


class ReclamationService:
    allowed_problem_types = {
        "BUG_TECHNIQUE",
        "PROBLEME_JURIDIQUE",
        "ERREUR_REPONSE_CHATBOT",
        "AUTRE",
    }
    allowed_priorities = {"LOW", "NORMAL", "HIGH", "URGENT"}
    allowed_admin_statuses = {"PENDING", "IN_PROGRESS", "RESOLVED"}
    allowed_attachment_types = {
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
        ".doc",
        ".docx",
    }
    max_attachment_size = 5 * 1024 * 1024

    def __init__(self, notification_service: NotificationService | None = None) -> None:
        self.repository = ReclamationRepository()
        self.notification_service = notification_service
        self.storage_dir = Path(settings.reclamations_storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def ensure_indexes(self) -> None:
        self.repository.ensure_indexes()

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
            attachment_payload = await self._store_attachment(attachment)

        now = datetime.now(UTC)
        ticket_number = self._build_ticket_number(now)
        user_email = str(current_user.get("email", "")).lower().strip()
        user_id = str(current_user.get("id", "")).strip()

        reclamation = ReclamationModel(
            user_id=user_id,
            user_email=user_email,
            ticket_number=ticket_number,
            subject=normalized_subject,
            description=normalized_description,
            problem_type=normalized_problem_type,
            custom_problem_type=normalized_custom_problem_type,
            priority=normalized_priority,
            status="PENDING",
            attachment_name=attachment_payload["name"] if attachment_payload else None,
            attachment_path=attachment_payload["path"] if attachment_payload else None,
            attachment_size=attachment_payload["size"] if attachment_payload else None,
            attachment_content_type=attachment_payload["content_type"] if attachment_payload else None,
            admin_reply=None,
            admin_reply_at=None,
            admin_reply_by=None,
            last_updated_by_admin_at=None,
            last_updated_by_admin_name=None,
            is_reply_read_by_user=True,
            created_at=now,
            updated_at=now,
            deleted_at=None,
            deleted_by_user_id=None,
            activity_log=[
                {
                    "id": uuid4().hex,
                    "description": "Reclamation creee",
                    "actorName": user_email,
                    "createdAt": now,
                }
            ],
        )

        created = self.repository.create(reclamation)
        return self._serialize_reclamation(created)

    def list_reclamations(self, current_user: dict) -> dict:
        if current_user.get("role") == "ADMIN":
            reclamations = self.repository.list_all()
        else:
            user_id = str(current_user.get("id", "")).strip()
            reclamations = self.repository.list_for_user(user_id)
        return {
            "items": [self._serialize_reclamation(item) for item in reclamations],
            "total": len(reclamations),
        }

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

    def get_reclamation_attachment_response_data(self, current_user: dict, reclamation_id: str) -> tuple[Path, str]:
        if current_user.get("role") == "ADMIN":
            reclamation = self.repository.get_by_id(reclamation_id)
            if reclamation is not None and reclamation.deleted_at is not None:
                reclamation = None
        else:
            user_id = str(current_user.get("id", "")).strip()
            reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")
        if not reclamation.attachment_path:
            raise ValueError("ATTACHMENT_NOT_FOUND")

        file_path = Path(reclamation.attachment_path)
        if not file_path.exists():
            raise ValueError("ATTACHMENT_NOT_FOUND")

        media_type = reclamation.attachment_content_type or "application/octet-stream"
        return file_path, media_type

    def delete_reclamation(self, current_user: dict, reclamation_id: str) -> None:
        user_id = str(current_user.get("id", "")).strip()
        reclamation = self.repository.get_for_user(reclamation_id, user_id)
        if reclamation is None:
            raise ValueError("RECLAMATION_NOT_FOUND")

        deleted = self.repository.soft_delete_for_user(reclamation_id, user_id)
        if not deleted:
            raise ValueError("RECLAMATION_NOT_FOUND")

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
        if reclamation.admin_reply_at is not None or (reclamation.admin_reply or "").strip():
            raise ValueError("RECLAMATION_ALREADY_RESOLVED_BY_ADMIN")

        admin_name = " ".join(
            part
            for part in [str(admin_user.get("prenom", "")).strip(), str(admin_user.get("nom", "")).strip()]
            if part
        ).strip() or str(admin_user.get("email", "")).strip() or "Administrateur"

        updated = self.repository.respond_as_admin(
            reclamation_id,
            admin_reply=normalized_reply,
            admin_reply_by=admin_name,
            status=normalized_status,
        )
        if updated is None:
            raise ValueError("RECLAMATION_NOT_FOUND")

        if self.notification_service is not None:
            await self.notification_service.notify_reclamation_updated(updated, admin_name)

        return self._serialize_reclamation(updated)

    async def _store_attachment(self, attachment: UploadFile) -> dict:
        extension = Path(attachment.filename or "").suffix.lower()
        if extension not in self.allowed_attachment_types:
            raise ValueError("INVALID_ATTACHMENT_TYPE")

        content = await attachment.read()
        if len(content) > self.max_attachment_size:
            raise ValueError("ATTACHMENT_TOO_LARGE")

        safe_name = self._safe_stem(Path(attachment.filename or "piece-jointe").stem)
        target_path = self.storage_dir / f"{safe_name}-{uuid4().hex}{extension}"
        target_path.write_bytes(content)

        return {
            "name": attachment.filename,
            "path": str(target_path),
            "size": len(content),
            "content_type": attachment.content_type or "application/octet-stream",
        }

    def _build_ticket_number(self, now: datetime) -> str:
        return f"REC-{now.strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"

    def _safe_stem(self, value: str) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9_-]+", "-", value).strip("-_")
        return cleaned or "piece-jointe"

    def _serialize_reclamation(self, reclamation: ReclamationModel) -> dict:
        attachment = None
        if reclamation.attachment_name:
            attachment = {
                "name": reclamation.attachment_name,
                "size": reclamation.attachment_size,
                "contentType": reclamation.attachment_content_type,
                "url": f"/api/v1/reclamations/{reclamation.id}/attachment" if reclamation.id else None,
            }

        return {
            "_id": reclamation.id,
            "ticketNumber": reclamation.ticket_number,
            "userId": reclamation.user_id,
            "userEmail": reclamation.user_email,
            "subject": reclamation.subject,
            "description": reclamation.description,
            "problemType": reclamation.problem_type,
            "customProblemType": reclamation.custom_problem_type,
            "priority": reclamation.priority,
            "status": reclamation.status,
            "attachment": attachment,
            "adminReply": reclamation.admin_reply,
            "adminReplyAt": reclamation.admin_reply_at.isoformat() if reclamation.admin_reply_at else None,
            "adminReplyBy": reclamation.admin_reply_by,
            "lastUpdatedByAdminAt": (
                reclamation.last_updated_by_admin_at.isoformat() if reclamation.last_updated_by_admin_at else None
            ),
            "lastUpdatedByAdminName": reclamation.last_updated_by_admin_name,
            "isReplyReadByUser": reclamation.is_reply_read_by_user,
            "createdAt": reclamation.created_at.isoformat(),
            "updatedAt": reclamation.updated_at.isoformat(),
            "deletedAt": reclamation.deleted_at.isoformat() if reclamation.deleted_at else None,
            "activityLog": [
                {
                    "id": str(item.get("id", "")),
                    "description": str(item.get("description", "")),
                    "actorName": str(item.get("actorName", "")),
                    "createdAt": self._serialize_datetime(item.get("createdAt")),
                }
                for item in reclamation.activity_log
            ],
        }

    def _serialize_datetime(self, value: object) -> str:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=UTC).isoformat()
            return value.astimezone(UTC).isoformat()
        return datetime.now(UTC).isoformat()
