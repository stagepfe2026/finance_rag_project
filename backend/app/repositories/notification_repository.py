from datetime import UTC, datetime

from app.core.database import get_notifications_collection
from app.models.notification_model import NotificationModel
from bson import ObjectId


class NotificationRepository:
    def __init__(self) -> None:
        self.collection = get_notifications_collection()

    # Crée les index MongoDB pour accélérer la récupération des notifications par utilisateur.
    def ensure_indexes(self) -> None:
        self.collection.create_index([("userId", 1), ("createdAt", -1)])
        self.collection.create_index([("userId", 1), ("isRead", 1), ("createdAt", -1)])

    # Insère un lot de notifications en base et retourne les objets avec leurs ids générés.
    def create(self, notifications: list[NotificationModel]) -> list[NotificationModel]:
        if not notifications:
            return []

        result = self.collection.insert_many([item.to_mongo_insert() for item in notifications])
        for item, inserted_id in zip(notifications, result.inserted_ids, strict=False):
            item.id = str(inserted_id)
        return notifications

    # Retourne les notifications les plus récentes d'un utilisateur, limitées à un nombre donné.
    def list_for_user(self, user_id: str, *, limit: int = 20) -> list[NotificationModel]:
        cursor = self.collection.find({"userId": user_id}).sort("createdAt", -1).limit(limit)
        return [NotificationModel.from_mongo(raw) for raw in cursor]

    # Marque une notification comme lue en enregistrant la date de lecture.
    def mark_read(self, notification_id: str, user_id: str) -> NotificationModel | None:
        if not ObjectId.is_valid(notification_id):
            return None

        self.collection.update_one(
            {"_id": ObjectId(notification_id), "userId": user_id},
            {"$set": {"isRead": True, "readAt": datetime.now(UTC)}},
        )
        raw = self.collection.find_one({"_id": ObjectId(notification_id), "userId": user_id})
        return NotificationModel.from_mongo(raw) if raw else None
