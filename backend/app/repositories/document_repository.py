import re
from datetime import UTC, date, datetime, time

from app.core.database import get_documents_collection
from app.models.document_model import DocumentModel
from app.schemas import DocumentStatus, LegalRelationType, LegalStatus
from bson import ObjectId


class DocumentRepository:
    def __init__(self):
        self.collection = get_documents_collection()

    # Construit un filtre MongoDB acceptant l'id en string ou en ObjectId pour la compatibilité.
    @staticmethod
    def _id_filter(document_id: str) -> dict:
        if not ObjectId.is_valid(document_id):
            return {"_id": document_id}

        return {"$or": [{"_id": ObjectId(document_id)}, {"_id": document_id}]}

    # Insère un nouveau document en base et retourne l'objet avec son id généré.
    def save(self, document: DocumentModel) -> DocumentModel:
        payload = document.to_mongo_insert()
        result = self.collection.insert_one(payload)
        document.id = str(result.inserted_id)
        return document

    # Passe un document en statut "processing" et efface l'éventuelle erreur précédente.
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

    # Passe un document en statut "indexed" en enregistrant le nombre de chunks et le texte extrait.
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

    # Passe un document en statut "failed" en enregistrant le message d'erreur d'indexation.
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

    # Supprime logiquement un document en le marquant abrogé et en enregistrant l'admin responsable.
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

    # Récupère un document par son identifiant, retourne None si introuvable ou id vide.
    def get_by_id(self, document_id: str) -> DocumentModel | None:
        if not document_id.strip():
            return None

        raw = self.collection.find_one(self._id_filter(document_id))
        if raw is None:
            return None
        return DocumentModel.from_mongo(raw)

    # Récupère plusieurs documents par une liste d'identifiants en une seule requête.
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

    # Vérifie si un document avec le même titre, catégorie et type légal existe déjà (insensible à la casse).
    def already_exists(
        self,
        *,
        title: str,
        category: str,
        legal_type: str,
    ) -> bool:
        normalized_title = " ".join(title.split()).strip()
        query = {
            "deletedAt": None,
            "title": {"$regex": f"^{re.escape(normalized_title)}$", "$options": "i"},
            "category": category,
            "legalType": legal_type,
        }
        return self.collection.count_documents(query, limit=1) > 0

    # Retourne une liste paginée de documents avec filtres optionnels sur la recherche, catégorie et statut.
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

    # Retourne les N documents indexés les plus récents (utilisé pour l'affichage des nouveautés).
    def latest_indexed(self, *, limit: int = 6) -> list[DocumentModel]:
        cursor = (
            self.collection.find({"deletedAt": None, "status": DocumentStatus.indexed.value})
            .sort("indexedAt", -1)
            .limit(limit)
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    # Retourne les documents indexés après une date donnée (utilisé pour les notifications de mise à jour).
    def indexed_after(self, since: datetime, *, limit: int = 20) -> list[DocumentModel]:
        cursor = (
            self.collection.find({
                "deletedAt": None,
                "status": DocumentStatus.indexed.value,
                "indexedAt": {"$gt": since},
            })
            .sort("indexedAt", -1)
            .limit(limit)
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    # Retourne les N documents créés les plus récents toutes catégories confondues.
    def latest_created(self, *, limit: int = 8) -> list[DocumentModel]:
        cursor = self.collection.find({"deletedAt": None}).sort("createdAt", -1).limit(limit)
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    # Retourne les documents en statut "futur" dont la date d'entrée en vigueur est dépassée.
    def pending_activation(self, *, now: datetime) -> list[DocumentModel]:
        cursor = self.collection.find(
            {
                "deletedAt": None,
                "legalStatus": LegalStatus.futur.value,
                "dateEntreeVigueur": {"$lte": now},
            }
        )
        return [DocumentModel.from_mongo(raw) for raw in cursor]

    # Compte le nombre total de documents correspondant aux filtres donnés (pour la pagination).
    def count_all(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
    ) -> int:
        query = self._build_list_query(search=search, category=category, status=status)
        return self.collection.count_documents(query)

    # Recherche des documents indexés avec filtres multiples (texte, titre, catégories, dates, favoris).
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

    # Compte le nombre de résultats d'une recherche pour la pagination côté client.
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

    # Met à jour les métadonnées légales d'un document (statut, type, dates, relation) sans toucher au contenu.
    def update_metadata(
        self,
        document_id: str,
        *,
        legal_status: str | None = None,
        legal_type: str | None = None,
        date_publication: datetime | None = None,
        date_entree_vigueur: datetime | None = None,
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
        if relation_to_target is not None:
            updates["relationToTarget"] = relation_to_target
        if target_document_id is not None:
            updates["targetDocumentId"] = target_document_id

        if updates:
            self.collection.update_one(self._id_filter(document_id), {"$set": updates})
        return self.get_by_id(document_id)

    # Met à jour le statut légal du document cible lors d'un remplacement ou abrogation.
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

    # Retourne les documents qui pointent vers un document cible via une relation de remplacement ou abrogation.
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

    # Construit le filtre MongoDB pour la liste admin avec recherche textuelle, catégorie et statut.
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

    # Construit le filtre MongoDB pour la recherche utilisateur avec tous les critères combinés.
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
