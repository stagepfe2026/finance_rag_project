from collections import defaultdict
from datetime import UTC, datetime, timedelta

from app.repositories.document_repository import DocumentRepository
from app.repositories.reclamation_repository import ReclamationRepository
from app.repositories.sessions_repository import SessionsRepository
from app.repositories.users_repository import UsersRepository
from app.services.notification_service import NotificationService


class DashboardService:
    def __init__(self, notification_service: NotificationService):
        self.documents_repository = DocumentRepository()
        self.reclamation_repository = ReclamationRepository()
        self.sessions_repository = SessionsRepository()
        self.users_repository = UsersRepository()
        self.notification_service = notification_service

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
        now = datetime.now(UTC)
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
                    "fileType": document.file_type,
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
        }
