from datetime import UTC, datetime

from app.core.database import get_reclamations_collection
from app.models.reclamation_model import ReclamationModel
from app.repositories.index_helpers import create_partial_unique_string_index
from bson import ObjectId


class ReclamationRepository:
    def __init__(self) -> None:
        self.collection = get_reclamations_collection()

    # Crée les index MongoDB pour accélérer les requêtes par utilisateur, statut et date.
    def ensure_indexes(self) -> None:
        self.collection.create_index([("userId", 1), ("createdAt", -1)])
        self.collection.create_index([("deletedAt", 1), ("createdAt", -1)])
        self.collection.create_index([("status", 1), ("priority", 1), ("createdAt", -1)])
        create_partial_unique_string_index(self.collection, "referenceNumber")

    # Insère une nouvelle réclamation en base et retourne l'objet avec son id généré.
    def create(self, reclamation: ReclamationModel) -> ReclamationModel:
        result = self.collection.insert_one(reclamation.to_mongo_insert())
        reclamation.id = str(result.inserted_id)
        return reclamation

    # Retourne toutes les réclamations actives d'un utilisateur, triées du plus récent.
    def list_for_user(self, user_id: str) -> list[ReclamationModel]:
        cursor = self.collection.find({"userId": user_id, "deletedAt": None}).sort("createdAt", -1)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    # Retourne toutes les réclamations actives de tous les utilisateurs (usage admin).
    def list_all(self) -> list[ReclamationModel]:
        cursor = self.collection.find({"deletedAt": None}).sort("createdAt", -1)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    # Retourne les réclamations récentes toutes confondues y compris supprimées (usage audit).
    def list_for_audit(self, *, limit: int = 250) -> list[ReclamationModel]:
        cursor = self.collection.find({}).sort("createdAt", -1).limit(limit)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    # Récupère une réclamation par son identifiant sans restriction d'utilisateur.
    def get_by_id(self, reclamation_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id)})
        return ReclamationModel.from_mongo(raw) if raw else None

    # Récupère une réclamation active en vérifiant qu'elle appartient à l'utilisateur demandeur.
    def get_for_user(self, reclamation_id: str, user_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id, "deletedAt": None})
        return ReclamationModel.from_mongo(raw) if raw else None

    # Marque la réponse admin d'une réclamation comme lue par l'utilisateur.
    def acknowledge_reply(self, reclamation_id: str, user_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        object_id = ObjectId(reclamation_id)
        query = {"_id": object_id, "userId": user_id, "deletedAt": None}
        self.collection.update_one(query, {"$set": {"replyAcknowledged": True}})
        raw = self.collection.find_one(query)
        return ReclamationModel.from_mongo(raw) if raw else None

    # Passe une réclamation en statut FAILED et ajoute une entrée dans l'historique.
    def flag_as_failed(self, reclamation_id: str, user_id: str, description: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": description,
            "actorName": user_id,
            "createdAt": now,
        }
        self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "userId": user_id},
            {
                "$set": {"status": "FAILED", "updatedAt": now},
                "$push": {"history": activity_item},
            },
        )
        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id})
        return ReclamationModel.from_mongo(raw) if raw else None

    # Supprime logiquement une réclamation et ajoute une entrée dans l'historique.
    def delete_for_user(self, reclamation_id: str, user_id: str) -> bool:
        if not ObjectId.is_valid(reclamation_id):
            return False

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": "Reclamation supprimee par l utilisateur",
            "actorName": user_id,
            "createdAt": now,
        }
        result = self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "userId": user_id, "deletedAt": None},
            {
                "$set": {
                    "deletedAt": now,
                    "deletedByUserId": user_id,
                    "updatedAt": now,
                },
                "$push": {"history": activity_item},
            },
        )
        return result.modified_count > 0

    # Modifie le contenu d'une réclamation en statut PENDING et trace la modification dans l'historique.
    def edit_for_user(
        self,
        reclamation_id: str,
        user_id: str,
        *,
        subject: str,
        description: str,
        issue_category: str,
        custom_issue_category: str | None,
        priority: str,
        attachment_payload: dict | None = None,
    ) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": "Reclamation modifiee par l utilisateur",
            "actorName": user_id,
            "createdAt": now,
        }
        update_fields = {
            "subject": subject,
            "description": description,
            "issueCategory": issue_category,
            "customIssueCategory": custom_issue_category,
            "priority": priority,
            "updatedAt": now,
        }
        if attachment_payload is not None:
            update_fields.update(
                {
                    "attachmentName": attachment_payload["name"],
                    "attachmentPath": attachment_payload["path"],
                    "attachmentSize": attachment_payload["size"],
                    "attachmentContentType": attachment_payload["content_type"],
                }
            )

        result = self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "userId": user_id, "deletedAt": None, "status": "PENDING"},
            {
                "$set": update_fields,
                "$push": {"history": activity_item},
            },
        )
        if result.modified_count == 0:
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id, "deletedAt": None})
        return ReclamationModel.from_mongo(raw) if raw else None

    # Assigne une réclamation à un admin, passe son statut en IN_PROGRESS et trace l'action.
    def assign_to_admin(self, reclamation_id: str, admin_id: str, admin_name: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": f"Reclamation prise en charge par {admin_name}",
            "actorName": admin_name,
            "createdAt": now,
        }
        result = self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "deletedAt": None, "status": "PENDING"},
            {
                "$set": {
                    "status": "IN_PROGRESS",
                    "firstHandledAt": now,
                    "takenByAdminId": admin_id,
                    "takenByAdminName": admin_name,
                    "updatedAt": now,
                },
                "$push": {"history": activity_item},
            },
        )
        if result.modified_count == 0:
            return None
        raw = self.collection.find_one({"_id": ObjectId(reclamation_id)})
        return ReclamationModel.from_mongo(raw) if raw else None

    # Enregistre la date d'envoi de l'alerte SLA pour éviter les notifications dupliquées.
    def record_sla_alert_sent(self, reclamation_id: str | None) -> None:
        if not reclamation_id or not ObjectId.is_valid(reclamation_id):
            return
        self.collection.update_one(
            {"_id": ObjectId(reclamation_id)},
            {"$set": {"slaOverdueNotifiedAt": datetime.now(UTC)}},
        )

    # Enregistre la réponse de l'admin sur une réclamation et met à jour son statut.
    def save_admin_reply(
        self,
        reclamation_id: str,
        *,
        admin_reply: str,
        replied_by_admin_id: str,
        status: str,
    ) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": f"Reclamation mise a jour par l administrateur ({status})",
            "actorName": replied_by_admin_id,
            "createdAt": now,
        }
        self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "deletedAt": None},
            {
                "$set": {
                    "status": status,
                    "adminReply": admin_reply,
                    "adminReplyAt": now,
                    "repliedByAdminId": replied_by_admin_id,
                    "replyAcknowledged": False,
                    "updatedAt": now,
                },
                "$push": {"history": activity_item},
            },
        )
        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "deletedAt": None})
        return ReclamationModel.from_mongo(raw) if raw else None
