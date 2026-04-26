from datetime import UTC, date, datetime, time

from app.core.database import get_documents_collection
from app.models.document_model import DocumentModel
from app.schemas import DocumentStatus, LegalRelationType, LegalStatus
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

    def get_by_ids(self, document_ids: list[str]) -> list[DocumentModel]:
        valid_ids = [ObjectId(document_id) for document_id in document_ids if ObjectId.is_valid(document_id)]
        if not valid_ids:
            return []

        cursor = self.collection.find({"_id": {"$in": valid_ids}})
        return [DocumentModel.from_mongo(raw) for raw in cursor]

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

    def list_recent_indexed(self, *, limit: int = 6) -> list[DocumentModel]:
        cursor = (
            self.collection.find({"deletedAt": None, "documentStatus": DocumentStatus.indexed.value})
            .sort("indexedAt", -1)
            .limit(limit)
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def list_recent_documents(self, *, limit: int = 8) -> list[DocumentModel]:
        cursor = self.collection.find({"deletedAt": None}).sort("createdAt", -1).limit(limit)
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
        current_user_id: str | None = None,
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
            current_user_id=current_user_id,
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
        current_user_id: str | None = None,
    ) -> int:
        mongo_query = self._build_search_query(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorites_only=favorites_only,
            current_user_id=current_user_id,
        )
        return self.collection.count_documents(mongo_query)

    def set_favorite(self, document_id: str, user_id: str, is_favored: bool) -> DocumentModel | None:
        if not ObjectId.is_valid(document_id):
            return None

        update_operator = {"$addToSet": {"favoriteUserIds": user_id}} if is_favored else {"$pull": {"favoriteUserIds": user_id}}
        self.collection.update_one(
            {"_id": ObjectId(document_id), "deletedAt": None},
            update_operator,
        )
        return self.get_by_id(document_id)

    def update_legal_metadata(
        self,
        document_id: str,
        *,
        legal_status: str | None = None,
        document_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        version: str | None = None,
        relation_type: str | None = None,
        related_document_id: str | None = None,
    ) -> DocumentModel | None:
        if not ObjectId.is_valid(document_id):
            return None

        updates: dict[str, object] = {}
        if legal_status is not None:
            updates["legalStatus"] = legal_status
        if document_type is not None:
            updates["documentType"] = document_type
        if date_publication is not None:
            updates["datePublication"] = date_publication
        if date_entree_vigueur is not None:
            updates["dateEntreeVigueur"] = date_entree_vigueur
        if version is not None:
            updates["version"] = version
        if relation_type is not None:
            updates["relationType"] = relation_type
        if related_document_id is not None:
            updates["relatedDocumentId"] = related_document_id

        if updates:
            self.collection.update_one({"_id": ObjectId(document_id)}, {"$set": updates})
        return self.get_by_id(document_id)

    def apply_incoming_relation(
        self,
        target_document_id: str,
        relation_type: str,
        source_document_id: str,
    ) -> DocumentModel | None:
        if not ObjectId.is_valid(target_document_id):
            return None

        if relation_type == LegalRelationType.remplace.value:
            legal_status = LegalStatus.remplace.value
        elif relation_type == LegalRelationType.abroge.value:
            legal_status = LegalStatus.abroge.value
        elif relation_type == LegalRelationType.modifie.value:
            legal_status = LegalStatus.modifie.value
        else:
            legal_status = LegalStatus.inconnu.value

        self.collection.update_one(
            {"_id": ObjectId(target_document_id)},
            {
                "$set": {
                    "legalStatus": legal_status,
                    "relationType": relation_type,
                    "relatedDocumentId": source_document_id,
                }
            },
        )
        return self.get_by_id(target_document_id)

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
        current_user_id: str | None = None,
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
            if current_user_id:
                filters.append({"favoriteUserIds": current_user_id})
            else:
                filters.append({"_id": {"$exists": False}})

        if filters:
            mongo_query["$and"] = filters

        return mongo_query
