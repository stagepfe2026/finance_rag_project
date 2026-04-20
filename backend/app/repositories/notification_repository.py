from datetime import UTC, datetime

from bson import ObjectId

from app.core.database import get_notifications_collection
from app.models.notification_model import NotificationModel


class NotificationRepository:
    def __init__(self) -> None:
        self.collection = get_notifications_collection()

    def ensure_indexes(self) -> None:
        self.collection.create_index([("userId", 1), ("createdAt", -1)])
        self.collection.create_index([("userId", 1), ("isRead", 1), ("createdAt", -1)])

    def create_many(self, notifications: list[NotificationModel]) -> list[NotificationModel]:
        if not notifications:
            return []

        result = self.collection.insert_many([item.to_mongo_insert() for item in notifications])
        for item, inserted_id in zip(notifications, result.inserted_ids, strict=False):
            item.id = str(inserted_id)
        return notifications

    def list_for_user(self, user_id: str, *, limit: int = 20) -> list[NotificationModel]:
        cursor = self.collection.find({"userId": user_id}).sort("createdAt", -1).limit(limit)
        return [NotificationModel.from_mongo(raw) for raw in cursor]

    def mark_as_read(self, notification_id: str, user_id: str) -> NotificationModel | None:
        if not ObjectId.is_valid(notification_id):
            return None

        self.collection.update_one(
            {"_id": ObjectId(notification_id), "userId": user_id},
            {"$set": {"isRead": True, "readAt": datetime.now(UTC)}},
        )
        raw = self.collection.find_one({"_id": ObjectId(notification_id), "userId": user_id})
        return NotificationModel.from_mongo(raw) if raw else None
