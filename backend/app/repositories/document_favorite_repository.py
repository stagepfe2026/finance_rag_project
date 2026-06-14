from datetime import UTC, datetime

from app.core.database import get_document_favorites_collection
from app.models.document_favorite_model import DocumentFavoriteModel
from bson import ObjectId


class DocumentFavoriteRepository:
    def __init__(self):
        self.collection = get_document_favorites_collection()

    # Crée les index MongoDB pour accélérer les recherches par utilisateur et par document.
    def ensure_indexes(self) -> None:
        self.collection.create_index([("documentId", 1), ("userId", 1)], unique=True)
        self.collection.create_index([("userId", 1)])
        self.collection.create_index([("documentId", 1)])

    # Ajoute un document aux favoris d'un utilisateur via upsert pour éviter les doublons.
    def add(self, document_id: str, user_id: str) -> DocumentFavoriteModel:
        now = datetime.now(UTC)
        self.collection.update_one(
            {"documentId": document_id, "userId": user_id},
            {"$setOnInsert": {"documentId": document_id, "userId": user_id, "favoritedAt": now}},
            upsert=True,
        )
        raw = self.collection.find_one({"documentId": document_id, "userId": user_id})
        return DocumentFavoriteModel.from_mongo(raw)

    # Supprime un document des favoris d'un utilisateur.
    def remove(self, document_id: str, user_id: str) -> None:
        self.collection.delete_one({"documentId": document_id, "userId": user_id})

    # Vérifie si un document est déjà en favori pour un utilisateur donné.
    def exists(self, document_id: str, user_id: str) -> bool:
        return self.collection.count_documents(
            {"documentId": document_id, "userId": user_id}, limit=1
        ) > 0

    # Retourne la liste des identifiants de documents mis en favori par un utilisateur.
    def get_document_ids_for_user(self, user_id: str) -> list[str]:
        cursor = self.collection.find({"userId": user_id}, {"documentId": 1})
        return [str(doc["documentId"]) for doc in cursor]

    # Retourne la liste des identifiants d'utilisateurs ayant mis un document en favori.
    def get_user_ids_for_document(self, document_id: str) -> list[str]:
        cursor = self.collection.find({"documentId": document_id}, {"userId": 1})
        return [str(doc["userId"]) for doc in cursor]

    # Supprime tous les favoris liés à un document (utilisé lors de la suppression du document).
    def delete_for_document(self, document_id: str) -> None:
        self.collection.delete_many({"documentId": document_id})

    # Convertit une chaîne en ObjectId si valide, sinon retourne la chaîne telle quelle.
    @staticmethod
    def _to_object_id(value: str) -> ObjectId | str:
        return ObjectId(value) if ObjectId.is_valid(value) else value
