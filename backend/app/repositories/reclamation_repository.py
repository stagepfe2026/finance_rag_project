from datetime import UTC, datetime

from bson import ObjectId

from app.core.database import get_reclamations_collection
from app.models.reclamation_model import ReclamationModel


class ReclamationRepository:
    def __init__(self) -> None:
        self.collection = get_reclamations_collection()

    def ensure_indexes(self) -> None:
        self.collection.create_index([("userId", 1), ("createdAt", -1)])
        self.collection.create_index([("deletedAt", 1), ("createdAt", -1)])
        self.collection.create_index([("status", 1), ("priority", 1), ("createdAt", -1)])
        self.collection.create_index("ticketNumber", unique=True)

    def create(self, reclamation: ReclamationModel) -> ReclamationModel:
        result = self.collection.insert_one(reclamation.to_mongo_insert())
        reclamation.id = str(result.inserted_id)
        return reclamation

    def list_for_user(self, user_id: str) -> list[ReclamationModel]:
        cursor = self.collection.find({"userId": user_id, "deletedAt": None}).sort("createdAt", -1)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    def list_all(self) -> list[ReclamationModel]:
        cursor = self.collection.find({"deletedAt": None}).sort("createdAt", -1)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    def list_for_audit(self, *, limit: int = 250) -> list[ReclamationModel]:
        cursor = self.collection.find({}).sort("createdAt", -1).limit(limit)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    def get_by_id(self, reclamation_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id)})
        return ReclamationModel.from_mongo(raw) if raw else None

    def get_for_user(self, reclamation_id: str, user_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id, "deletedAt": None})
        return ReclamationModel.from_mongo(raw) if raw else None

    def mark_reply_read_for_user(self, reclamation_id: str, user_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        object_id = ObjectId(reclamation_id)
        query = {"_id": object_id, "userId": user_id, "deletedAt": None}
        self.collection.update_one(query, {"$set": {"isReplyReadByUser": True}})
        raw = self.collection.find_one(query)
        return ReclamationModel.from_mongo(raw) if raw else None

    def mark_failed(self, reclamation_id: str, user_id: str, description: str) -> ReclamationModel | None:
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
                "$push": {"activityLog": activity_item},
            },
        )
        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id})
        return ReclamationModel.from_mongo(raw) if raw else None

    def soft_delete_for_user(self, reclamation_id: str, user_id: str) -> bool:
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
                "$push": {"activityLog": activity_item},
            },
        )
        return result.modified_count > 0

    def respond_as_admin(
        self,
        reclamation_id: str,
        *,
        admin_reply: str,
        admin_reply_by: str,
        status: str,
    ) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        now = datetime.now(UTC)
        activity_item = {
            "id": ObjectId().binary.hex(),
            "description": f"Reclamation mise a jour par l administrateur ({status})",
            "actorName": admin_reply_by,
            "createdAt": now,
        }
        self.collection.update_one(
            {"_id": ObjectId(reclamation_id), "deletedAt": None},
            {
                "$set": {
                    "status": status,
                    "adminReply": admin_reply,
                    "adminReplyAt": now,
                    "adminReplyBy": admin_reply_by,
                    "lastUpdatedByAdminAt": now,
                    "lastUpdatedByAdminName": admin_reply_by,
                    "isReplyReadByUser": False,
                    "updatedAt": now,
                },
                "$push": {"activityLog": activity_item},
            },
        )
        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "deletedAt": None})
        return ReclamationModel.from_mongo(raw) if raw else None
