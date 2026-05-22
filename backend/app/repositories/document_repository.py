import re
from datetime import UTC, date, datetime, time

from app.core.database import get_documents_collection
from app.models.document_model import DocumentModel
from app.schemas import DocumentStatus, LegalRelationType, LegalStatus
from bson import ObjectId


class DocumentRepository:
    def __init__(self):
        self.collection = get_documents_collection()

    @staticmethod
    def _id_filter(document_id: str) -> dict:
        if not ObjectId.is_valid(document_id):
            return {"_id": document_id}

        return {"$or": [{"_id": ObjectId(document_id)}, {"_id": document_id}]}

    def save(self, document: DocumentModel) -> DocumentModel:
        payload = document.to_mongo_insert()
        result = self.collection.insert_one(payload)
        document.id = str(result.inserted_id)
        return document

    def set_as_processing(self, document_id: str) -> DocumentModel | None:
        self.collection.update_one(
            self._id_filter(document_id),
            {
                "$set": {
                    "status": DocumentStatus.processing.value,
                    "lastIndexError": None,
                }
            },
        )
        return self.get_by_id(document_id)

    def set_as_indexed(
        self,
        document_id: str,
        chunk_count: int,
        extracted_text: str | None = None,
        indexed_by_admin_id: str | None = None,
    ) -> DocumentModel | None:
        self.collection.update_one(
            self._id_filter(document_id),
            {
                "$set": {
                    "status": DocumentStatus.indexed.value,
                    "indexedAt": datetime.now(UTC),
                    "chunkCount": chunk_count,
                    "lastIndexError": None,
                    "extractedText": extracted_text,
                    "indexedByAdminId": indexed_by_admin_id,
                }
            },
        )
        return self.get_by_id(document_id)

    def set_as_failed(self, document_id: str, error_message: str) -> DocumentModel | None:
        self.collection.update_one(
            self._id_filter(document_id),
            {
                "$set": {
                    "status": DocumentStatus.failed.value,
                    "lastIndexError": error_message,
                }
            },
        )
        return self.get_by_id(document_id)

    def remove(self, document_id: str, deleted_by_admin_id: str | None = None) -> DocumentModel | None:
        now = datetime.now(UTC)
        self.collection.update_one(
            {**self._id_filter(document_id), "deletedAt": None},
            {
                "$set": {
                    "legalStatus": LegalStatus.abroge.value,
                    "deletedAt": now,
                    "lastIndexError": None,
                    "deletedByAdminId": deleted_by_admin_id,
                }
            },
        )
        return self.get_by_id(document_id)

    def get_by_id(self, document_id: str) -> DocumentModel | None:
        if not document_id.strip():
            return None

        raw = self.collection.find_one(self._id_filter(document_id))
        if raw is None:
            return None
        return DocumentModel.from_mongo(raw)

    def get_many_by_ids(self, document_ids: list[str]) -> list[DocumentModel]:
        valid_ids = [document_id for document_id in document_ids if document_id.strip()]
        if not valid_ids:
            return []

        id_values = []
        for document_id in valid_ids:
            id_values.append(document_id)
            if ObjectId.is_valid(document_id):
                id_values.append(ObjectId(document_id))

        cursor = self.collection.find({"_id": {"$in": id_values}})
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def already_exists(
        self,
        *,
        title: str,
        category: str,
        legal_type: str,
        version: str,
    ) -> bool:
        normalized_title = " ".join(title.split()).strip()
        query = {
            "deletedAt": None,
            "title": {"$regex": f"^{re.escape(normalized_title)}$", "$options": "i"},
            "category": category,
            "legalType": legal_type,
            "version": version.strip(),
        }
        return self.collection.count_documents(query, limit=1) > 0

    def list_all(
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

    def latest_indexed(self, *, limit: int = 6) -> list[DocumentModel]:
        cursor = (
            self.collection.find({"deletedAt": None, "status": DocumentStatus.indexed.value})
            .sort("indexedAt", -1)
            .limit(limit)
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def latest_created(self, *, limit: int = 8) -> list[DocumentModel]:
        cursor = self.collection.find({"deletedAt": None}).sort("createdAt", -1).limit(limit)
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def pending_activation(self, *, now: datetime) -> list[DocumentModel]:
        cursor = self.collection.find(
            {
                "deletedAt": None,
                "legalStatus": LegalStatus.futur.value,
                "dateEntreeVigueur": {"$lte": now},
            }
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def count_all(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> int:
        query = self._build_list_query(search=search, category=category, status=status)
        return self.collection.count_documents(query)

    def search(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorite_document_ids: list[str] | None = None,
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
            favorite_document_ids=favorite_document_ids,
        )
        sort_config = [("datePublication", -1), ("createdAt", -1)] if sort_by == "recent" else [("title", 1)]
        cursor = self.collection.find(mongo_query).sort(sort_config).skip(skip).limit(limit)
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def count_search_results(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorite_document_ids: list[str] | None = None,
    ) -> int:
        mongo_query = self._build_search_query(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorite_document_ids=favorite_document_ids,
        )
        return self.collection.count_documents(mongo_query)

    def update_metadata(
        self,
        document_id: str,
        *,
        legal_status: str | None = None,
        legal_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
        version: str | None = None,
        relation_to_target: str | None = None,
        target_document_id: str | None = None,
    ) -> DocumentModel | None:
        if not document_id.strip():
            return None

        updates: dict[str, object] = {}
        if legal_status is not None:
            updates["legalStatus"] = legal_status
        if legal_type is not None:
            updates["legalType"] = legal_type
        if date_publication is not None:
            updates["datePublication"] = date_publication
        if date_entree_vigueur is not None:
            updates["dateEntreeVigueur"] = date_entree_vigueur
        if version is not None:
            updates["version"] = version
        if relation_to_target is not None:
            updates["relationToTarget"] = relation_to_target
        if target_document_id is not None:
            updates["targetDocumentId"] = target_document_id

        if updates:
            self.collection.update_one(self._id_filter(document_id), {"$set": updates})
        return self.get_by_id(document_id)

    def register_as_target(
        self,
        target_document_id: str,
        relation_to_target: str,
        source_document_id: str,
    ) -> DocumentModel | None:
        if not target_document_id.strip():
            return None

        if relation_to_target == LegalRelationType.remplace.value:
            legal_status = LegalStatus.remplace.value
        elif relation_to_target == LegalRelationType.abroge.value:
            legal_status = LegalStatus.abroge.value
        else:
            return self.get_by_id(target_document_id)

        self.collection.update_one(
            self._id_filter(target_document_id),
            {
                "$set": {
                    "legalStatus": legal_status,
                    "relationToTarget": relation_to_target,
                    "targetDocumentId": source_document_id,
                }
            },
        )
        return self.get_by_id(target_document_id)

    def find_documents_pointing_to(self, target_document_id: str) -> list[DocumentModel]:
        if not target_document_id.strip():
            return []

        cursor = self.collection.find(
            {
                "deletedAt": None,
                "targetDocumentId": target_document_id,
                "relationToTarget": {
                    "$in": [
                        LegalRelationType.remplace.value,
                        LegalRelationType.abroge.value,
                    ]
                },
            }
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    def _build_list_query(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> dict:
        query: dict = {}

        normalized_search = (search or "").strip()
        if normalized_search:
            query["$or"] = [
                {"title": {"$regex": normalized_search, "$options": "i"}},
            ]

        if category:
            query["category"] = category

        if status:
            query["status"] = status

        return query

    def _build_search_query(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorite_document_ids: list[str] | None = None,
    ) -> dict:
        mongo_query: dict = {
            "deletedAt": None,
            "status": DocumentStatus.indexed.value,
        }
        filters: list[dict] = []

        normalized_query = (query or "").strip()
        if normalized_query:
            filters.append(
                {
                    "$or": [
                        {"title": {"$regex": normalized_query, "$options": "i"}},
                        {"extractedText": {"$regex": normalized_query, "$options": "i"}},
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
            filters.append({"datePublication": date_range})

        if favorite_document_ids is not None:
            if favorite_document_ids:
                id_values = []
                for doc_id in favorite_document_ids:
                    id_values.append(doc_id)
                    if ObjectId.is_valid(doc_id):
                        id_values.append(ObjectId(doc_id))
                filters.append({"_id": {"$in": id_values}})
            else:
                filters.append({"_id": {"$exists": False}})

        if filters:
            mongo_query["$and"] = filters

        return mongo_query
