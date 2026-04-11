from datetime import UTC, datetime

from app.core.database import get_documents_collection
from app.models.document_model import DocumentModel
from app.schemas import DocumentStatus
from bson import ObjectId


class DocumentRepository:
    def __init__(self):
        self.collection = get_documents_collection()

    def create(self, document: DocumentModel) -> DocumentModel:
        payload = document.to_mongo_insert()
        result = self.collection.insert_one(payload)
        document.id = str(result.inserted_id)
        return document

    def mark_processing(self, document_id: str) -> DocumentModel | None:
        self.collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "documentStatus": DocumentStatus.processing.value,
                    "indexError": None,
                }
            },
        )
        return self.get_by_id(document_id)

    def mark_indexed(
        self,
        document_id: str,
        chunks_count: int,
        content: str | None = None,
    ) -> DocumentModel | None:
        self.collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "documentStatus": DocumentStatus.indexed.value,
                    "indexedAt": datetime.now(UTC),
                    "chunksCount": chunks_count,
                    "indexError": None,
                    "content": content,
                }
            },
        )
        return self.get_by_id(document_id)

    def mark_failed(self, document_id: str, error_message: str) -> DocumentModel | None:
        self.collection.update_one(
            {"_id": ObjectId(document_id)},
            {
                "$set": {
                    "documentStatus": DocumentStatus.failed.value,
                    "indexError": error_message,
                }
            },
        )
        return self.get_by_id(document_id)

    def get_by_id(self, document_id: str) -> DocumentModel | None:
        raw = self.collection.find_one({"_id": ObjectId(document_id)})
        if raw is None:
            return None
        return DocumentModel.from_mongo(raw)

    def list_documents(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[DocumentModel]:
        query = self._build_list_query(search=search, category=category, status=status)
        cursor = self.collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def count_documents(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> int:
        query = self._build_list_query(search=search, category=category, status=status)
        return self.collection.count_documents(query)

    def _build_list_query(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> dict:
        query: dict = {"deletedAt": None}

        normalized_search = (search or "").strip()
        if normalized_search:
            query["$or"] = [
                {"title": {"$regex": normalized_search, "$options": "i"}},
                {"description": {"$regex": normalized_search, "$options": "i"}},
            ]

        if category:
            query["category"] = category

        if status:
            query["documentStatus"] = status

        return query
