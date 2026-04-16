from datetime import UTC, date, datetime, time

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
        if not ObjectId.is_valid(document_id):
            return None

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

    def search_documents(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
        sort_by: str = "recent",
        skip: int = 0,
        limit: int = 100,
    ) -> list[DocumentModel]:
        mongo_query = self._build_search_query(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
        )
        sort_config = [("createdAt", -1)] if sort_by == "recent" else [("title", 1)]
        cursor = self.collection.find(mongo_query).sort(sort_config).skip(skip).limit(limit)
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def count_search_documents(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
    ) -> int:
        mongo_query = self._build_search_query(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
        )
        return self.collection.count_documents(mongo_query)

    def set_favorite(self, document_id: str, is_favored: bool) -> DocumentModel | None:
        if not ObjectId.is_valid(document_id):
            return None

        self.collection.update_one(
            {"_id": ObjectId(document_id), "deletedAt": None},
            {"$set": {"isFavored": is_favored}},
        )
        return self.get_by_id(document_id)

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

    def _build_search_query(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
    ) -> dict:
        mongo_query: dict = {
            "deletedAt": None,
            "documentStatus": DocumentStatus.indexed.value,
        }
        filters: list[dict] = []

        normalized_query = (query or "").strip()
        if normalized_query:
            filters.append(
                {
                    "$or": [
                        {"title": {"$regex": normalized_query, "$options": "i"}},
                        {"description": {"$regex": normalized_query, "$options": "i"}},
                        {"content": {"$regex": normalized_query, "$options": "i"}},
                        {"category": {"$regex": normalized_query, "$options": "i"}},
                    ]
                }
            )

        normalized_title = (title or "").strip()
        if normalized_title:
            filters.append({"title": {"$regex": normalized_title, "$options": "i"}})

        normalized_categories = [item for item in categories or [] if item]
        if normalized_categories:
            filters.append({"category": {"$in": normalized_categories}})

        if date_from or date_to:
            date_range: dict = {}
            if date_from:
                date_range["$gte"] = datetime.combine(date_from, time.min, tzinfo=UTC)
            if date_to:
                date_range["$lte"] = datetime.combine(date_to, time.max, tzinfo=UTC)
            filters.append({"createdAt": date_range})

        if favorites_only:
            filters.append({"isFavored": True})

        if filters:
            mongo_query["$and"] = filters

        return mongo_query
