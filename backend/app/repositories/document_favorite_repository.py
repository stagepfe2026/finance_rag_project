from datetime import UTC, datetime

from app.core.database import get_document_favorites_collection
from app.models.document_favorite_model import DocumentFavoriteModel
from bson import ObjectId


class DocumentFavoriteRepository:
    def __init__(self):
        self.collection = get_document_favorites_collection()

    def ensure_indexes(self) -> None:
        self.collection.create_index([("documentId", 1), ("userId", 1)], unique=True)
        self.collection.create_index([("userId", 1)])
        self.collection.create_index([("documentId", 1)])

    def add(self, document_id: str, user_id: str) -> DocumentFavoriteModel:
        now = datetime.now(UTC)
        self.collection.update_one(
            {"documentId": document_id, "userId": user_id},
            {"$setOnInsert": {"documentId": document_id, "userId": user_id, "favoritedAt": now}},
            upsert=True,
        )
        raw = self.collection.find_one({"documentId": document_id, "userId": user_id})
        return DocumentFavoriteModel.from_mongo(raw)

    def remove(self, document_id: str, user_id: str) -> None:
        self.collection.delete_one({"documentId": document_id, "userId": user_id})

    def exists(self, document_id: str, user_id: str) -> bool:
        return self.collection.count_documents(
            {"documentId": document_id, "userId": user_id}, limit=1
        ) > 0

    def get_document_ids_for_user(self, user_id: str) -> list[str]:
        cursor = self.collection.find({"userId": user_id}, {"documentId": 1})
        return [str(doc["documentId"]) for doc in cursor]

    def get_user_ids_for_document(self, document_id: str) -> list[str]:
        cursor = self.collection.find({"documentId": document_id}, {"userId": 1})
        return [str(doc["userId"]) for doc in cursor]

    def delete_for_document(self, document_id: str) -> None:
        self.collection.delete_many({"documentId": document_id})

    @staticmethod
    def _to_object_id(value: str) -> ObjectId | str:
        return ObjectId(value) if ObjectId.is_valid(value) else value
