from collections import defaultdict
from datetime import UTC, datetime, timedelta

from app.models.reclamation_model import ReclamationModel
from app.repositories.document_repository import DocumentRepository
from app.repositories.reclamation_repository import ReclamationRepository
from app.repositories.sessions_repository import SessionsRepository
from app.repositories.users_repository import UsersRepository
from app.services.notification_service import NotificationService


class DashboardService:
    _SLA_MINUTES: dict[str, int] = {"URGENT": 240, "HIGH": 1440, "NORMAL": 4320, "LOW": 10080}
    _DUE_SOON_MINUTES: dict[str, int] = {"URGENT": 60, "HIGH": 360, "NORMAL": 1080, "LOW": 2520}

    @staticmethod
    def _sla_status(rec: ReclamationModel, now: datetime) -> str:
        sla_min = DashboardService._SLA_MINUTES.get(rec.priority, 4320)
        deadline = rec.created_at + timedelta(minutes=sla_min)
        first_handled = rec.first_handled_at
        if first_handled is None and rec.status in ("IN_PROGRESS", "RESOLVED", "FAILED"):
            first_handled = rec.updated_at
        if first_handled is not None:
            return "COMPLETED_ON_TIME" if first_handled <= deadline else "COMPLETED_LATE"
        if now > deadline:
            return "OVERDUE"
        remaining = (deadline - now).total_seconds() / 60
        due_soon = DashboardService._DUE_SOON_MINUTES.get(rec.priority, 1080)
        return "DUE_SOON" if remaining <= due_soon else "ON_TIME"

    def __init__(self, notification_service: NotificationService):
        self.documents_repository = DocumentRepository()
        self.reclamation_repository = ReclamationRepository()
        self.sessions_repository = SessionsRepository()
        self.users_repository = UsersRepository()
        self.notification_service = notification_service

    @staticmethod
    def _format_file_type(file_type: str) -> str:
        normalized = (file_type or "").strip().lower()
        if normalized == "application/pdf" or normalized.endswith(".pdf"):
            return "PDF"
        if (
            normalized == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            or normalized == "application/msword"
            or normalized.endswith(".docx")
            or normalized.endswith(".doc")
        ):
            return "Word"
        return file_type or "-"

    def get_user_home_dashboard(self, current_user: dict) -> dict:
        prenom = str(current_user.get("prenom", "")).strip()
        nom = str(current_user.get("nom", "")).strip()
        user_name = " ".join(part for part in [prenom, nom] if part).strip() or "Utilisateur"

        return {
            "userName": user_name,
            "recentDocuments": [
                document.to_out_schema() for document in self.documents_repository.list_recent_indexed(limit=6)
            ],
            "notifications": self.notification_service.list_notifications(current_user, limit=8)["items"],
        }

    def get_admin_overview_dashboard(self) -> dict:
        documents = self.documents_repository.list_recent_documents(limit=500)
        indexed_documents = self.documents_repository.list_recent_indexed(limit=6)
        all_reclamations = self.reclamation_repository.list_all()
        all_users = self.users_repository.list_all_active()
        recent_sessions = self.sessions_repository.list_recent(limit=80)

        total_documents = self.documents_repository.count_documents()
        indexed_count = self.documents_repository.count_documents(status="indexed")
        processing_count = self.documents_repository.count_documents(status="processing")
        failed_count = self.documents_repository.count_documents(status="failed")

        urgent_reclamations = [item for item in all_reclamations if item.priority == "URGENT" and item.status != "RESOLVED"]
        pending_reclamations = [item for item in all_reclamations if item.status == "PENDING"]
        in_progress_reclamations = [item for item in all_reclamations if item.status == "IN_PROGRESS"]
        resolved_reclamations = [item for item in all_reclamations if item.status == "RESOLVED"]

        now = datetime.now(UTC)
        sla_statuses = [self._sla_status(r, now) for r in all_reclamations]
        sla_overdue_count = sum(1 for s in sla_statuses if s == "OVERDUE")
        sla_due_soon_count = sum(1 for s in sla_statuses if s == "DUE_SOON")
        urgent_pending_count = sum(
            1 for r in all_reclamations if r.priority == "URGENT" and r.status == "PENDING"
        )
        completed_sla = [s for s in sla_statuses if s in ("COMPLETED_ON_TIME", "COMPLETED_LATE")]
        sla_respect_rate = (
            round(sum(1 for s in completed_sla if s == "COMPLETED_ON_TIME") / len(completed_sla), 2)
            if completed_sla
            else 0.0
        )
        handle_times = [
            int((r.first_handled_at - r.created_at).total_seconds() / 60)
            for r in all_reclamations
            if r.first_handled_at is not None
        ]
        avg_handle_time_minutes = int(sum(handle_times) / len(handle_times)) if handle_times else 0

        access_by_user: dict[str, dict] = {}
        for session in recent_sessions:
            current = access_by_user.get(session.user_id)
            if current is None or session.last_activity_at > current["lastActivityAt"]:
                access_by_user[session.user_id] = {
                    "lastActivityAt": session.last_activity_at,
                    "authMethod": session.auth_method,
                }

        users_map = {user.id or "": user for user in all_users}
        latest_access = []
        for user_id, access in access_by_user.items():
            user = users_map.get(user_id)
            if user is None:
                continue
            full_name = " ".join(part for part in [user.prenom.strip(), user.nom.strip()] if part).strip() or user.email
            latest_access.append(
                {
                    "userId": user.id or "",
                    "userName": full_name,
                    "email": user.email,
                    "role": user.role.value,
                    "lastActivityAt": access["lastActivityAt"].astimezone(UTC).isoformat(),
                    "authMethod": access["authMethod"],
                }
            )
        latest_access.sort(key=lambda item: item["lastActivityAt"], reverse=True)

        trend_buckets: dict[str, dict[str, int | str]] = defaultdict(lambda: {"label": "", "documents": 0, "reclamations": 0})
        for offset in range(30, -1, -1):
            day = (now - timedelta(days=offset)).date()
            key = day.isoformat()
            trend_buckets[key] = {"label": day.strftime("%d/%m"), "documents": 0, "reclamations": 0}

        for document in documents:
            day_key = document.created_at.astimezone(UTC).date().isoformat()
            if day_key in trend_buckets:
                trend_buckets[day_key]["documents"] += 1

        for reclamation in all_reclamations:
            day_key = reclamation.created_at.astimezone(UTC).date().isoformat()
            if day_key in trend_buckets:
                trend_buckets[day_key]["reclamations"] += 1

        return {
            "summary": {
                "documentsIndexed": indexed_count,
                "documentsTotal": total_documents,
                "reclamationsTotal": len(all_reclamations),
                "reclamationsUrgent": len(urgent_reclamations),
                "activeUsers": len(access_by_user),
                "pendingReclamations": len(pending_reclamations),
            },
            "reclamationBreakdown": {
                "pending": len(pending_reclamations),
                "inProgress": len(in_progress_reclamations),
                "resolved": len(resolved_reclamations),
                "urgent": len(urgent_reclamations),
            },
            "documentBreakdown": {
                "indexed": indexed_count,
                "processing": processing_count,
                "failed": failed_count,
            },
            "trend": [
                {
                    "date": key,
                    "label": value["label"],
                    "documents": value["documents"],
                    "reclamations": value["reclamations"],
                }
                for key, value in trend_buckets.items()
            ],
            "recentIndexedDocuments": [
                {
                    "id": document.id or "",
                    "title": document.title,
                    "category": document.category,
                    "documentStatus": document.document_status,
                    "createdAt": document.created_at.astimezone(UTC).isoformat(),
                    "indexedAt": document.indexed_at.astimezone(UTC).isoformat() if document.indexed_at else None,
                    "fileType": self._format_file_type(document.file_type),
                    "publicationDate": (
                        document.date_publication.astimezone(UTC).isoformat()
                        if document.date_publication
                        else None
                    ),
                    "effectiveDate": (
                        document.date_entree_vigueur.astimezone(UTC).isoformat()
                        if document.date_entree_vigueur
                        else None
                    ),
                    "chunksCount": document.chunks_count,
                }
                for document in indexed_documents
            ],
            "latestAccess": latest_access[:6],
            "urgentCases": [
                {
                    "id": item.id or "",
                    "ticketNumber": item.ticket_number,
                    "subject": item.subject,
                    "priority": item.priority,
                    "status": item.status,
                    "userEmail": item.user_email,
                    "createdAt": item.created_at.astimezone(UTC).isoformat(),
                }
                for item in urgent_reclamations[:5]
            ],
            "slaStats": {
                "overdueCount": sla_overdue_count,
                "dueSoonCount": sla_due_soon_count,
                "urgentPendingCount": urgent_pending_count,
                "respectRate": sla_respect_rate,
                "avgHandleTimeMinutes": avg_handle_time_minutes,
            },
        }
