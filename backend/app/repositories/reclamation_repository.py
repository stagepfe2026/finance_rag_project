from datetime import UTC, datetime

from bson import ObjectId

from app.core.database import get_reclamations_collection
from app.models.reclamation_model import ReclamationModel


class ReclamationRepository:
    def __init__(self) -> None:
        self.collection = get_reclamations_collection()

    def ensure_indexes(self) -> None:
        self.collection.create_index([("userId", 1), ("createdAt", -1)])
        self.collection.create_index("ticketNumber", unique=True)

    def create(self, reclamation: ReclamationModel) -> ReclamationModel:
        result = self.collection.insert_one(reclamation.to_mongo_insert())
        reclamation.id = str(result.inserted_id)
        return reclamation

    def list_for_user(self, user_id: str) -> list[ReclamationModel]:
        cursor = self.collection.find({"userId": user_id}).sort("createdAt", -1)
        return [ReclamationModel.from_mongo(raw) for raw in cursor]

    def get_for_user(self, reclamation_id: str, user_id: str) -> ReclamationModel | None:
        if not ObjectId.is_valid(reclamation_id):
            return None

        raw = self.collection.find_one({"_id": ObjectId(reclamation_id), "userId": user_id})
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
