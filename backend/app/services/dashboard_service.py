from app.repositories.document_repository import DocumentRepository
from app.services.notification_service import NotificationService


class DashboardService:
    def __init__(self, notification_service: NotificationService):
        self.documents_repository = DocumentRepository()
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
