import logging
from datetime import UTC, date, datetime
from typing import Literal

from app.core.config import settings
from qdrant_client import QdrantClient
from qdrant_client.models import (
    DatetimeRange,
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)


class QdrantRepository:
    def __init__(self):
        self.client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
        self.logger = logging.getLogger(__name__)

    def _normalize_collection_name(self, category: str) -> str:
        return category.lower().replace(" ", "_")

    def ensure_collection(self, collection_name: str, vector_size: int):
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]

        if collection_name in existing:
            return

        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    def collection_exists(self, collection_name: str) -> bool:
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]
        return collection_name in existing

    def upsert_chunks(
        self,
        category: str,
        document_id: str,
        document_title: str,
        document_name: str,
        document_type: str,
        legal_status: str,
        date_publication: str | None,
        date_entree_vigueur: str | None,
        version: str,
        relation_type: str,
        related_document_id: str | None,
        related_document_title: str | None,
        realized_at: str | None,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> int:
        collection_name = category.lower().replace(" ", "_")
        self.ensure_collection(collection_name, len(embeddings[0]))

        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings, strict=False)):
            points.append(
                PointStruct(
                    id=abs(hash(f"{document_id}-{idx}")),
                    vector=vector,
                    payload={
                        "document_id": document_id,
                        "document_title": document_title,
                        "document_name": document_name,
                        "document_type": document_type,
                        "legal_status": legal_status,
                        "date_publication": date_publication,
                        "date_entree_vigueur": date_entree_vigueur,
                        "version": version,
                        "relation_type": relation_type,
                        "related_document_id": related_document_id,
                        "related_document_title": related_document_title,
                        "realized_at": realized_at,
                        "category": category,
                        "chunk_index": idx,
                        "text": chunk,
                    },
                )
            )

        self.client.upsert(collection_name=collection_name, points=points)
        return len(points)

    def delete_document_chunks(self, category: str, document_id: str) -> None:
        collection_name = self._normalize_collection_name(category)
        if not self.collection_exists(collection_name):
            return

        self.client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )

    def get_all_collections(self) -> list[str]:
        collections = self.client.get_collections().collections
        return [collection.name for collection in collections]

    def search_chunks(
        self,
        category: str,
        query_vector: list[float],
        limit: int,
        document_id: str | None = None,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        collection_name = self._normalize_collection_name(category)

        if not self.collection_exists(collection_name):
            return []

        query_filter = self._build_query_filter(document_id=document_id, query_mode=query_mode)
        fallback_filter = self._build_query_filter(document_id=document_id, query_mode="future_preview")

        response = None
        try:
            response = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter,
            )
        except Exception:
            if query_mode != "current":
                raise
            self.logger.exception(
                "Qdrant current-mode datetime filter failed for collection=%s. Retrying without date filter.",
                collection_name,
            )
            response = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=fallback_filter,
            )

        points = response.points if hasattr(response, "points") else []

        chunks = [self._point_to_chunk(point, category) for point in points]
        return [
            chunk
            for chunk in chunks
            if self._matches_query_mode(chunk, query_mode)
        ]

    def _build_query_filter(
        self,
        *,
        document_id: str | None,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> Filter | None:
        must_conditions = []
        if document_id:
            must_conditions.append(
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            )

        if query_mode == "current":
            must_conditions.append(
                FieldCondition(
                    key="date_entree_vigueur",
                    range=DatetimeRange(lte=datetime.now(UTC)),
                )
            )

        return Filter(must=must_conditions) if must_conditions else None

    @staticmethod
    def _point_to_chunk(point: object, category: str) -> dict:
        payload = getattr(point, "payload", None) or {}
        return {
            "score": getattr(point, "score", 0.0),
            "text": payload.get("text", ""),
            "document_id": payload.get("document_id", ""),
            "document_title": payload.get("document_title", ""),
            "document_name": payload.get("document_name", ""),
            "document_type": payload.get("document_type", ""),
            "legal_status": payload.get("legal_status", "actif"),
            "date_publication": payload.get("date_publication"),
            "date_entree_vigueur": payload.get("date_entree_vigueur"),
            "version": payload.get("version", ""),
            "relation_type": payload.get("relation_type", "none"),
            "related_document_id": payload.get("related_document_id"),
            "related_document_title": payload.get("related_document_title", ""),
            "realized_at": payload.get("realized_at"),
            "category": payload.get("category", category),
            "chunk_index": payload.get("chunk_index", -1),
        }

    @classmethod
    def _matches_query_mode(
        cls,
        chunk: dict,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> bool:
        if query_mode != "current":
            return True

        effective_date = cls._parse_date(chunk.get("date_entree_vigueur"))
        if effective_date is None:
            return False
        return effective_date <= datetime.now(UTC).date()

    @staticmethod
    def _parse_date(value: object) -> date | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
            except ValueError:
                return None
        return None

    def search_chunks_for_document(
        self,
        *,
        category: str,
        document_id: str,
        query_vector: list[float],
        limit: int,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        return self.search_chunks(
            category=category,
            query_vector=query_vector,
            limit=limit,
            document_id=document_id,
            query_mode=query_mode,
        )

    def search_chunks_by_category(
        self,
        categories: list[str],
        query_vector: list[float],
        limit_per_category: int,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        all_results = []
        for category in categories:
            category_results = self.search_chunks(
                category=category,
                query_vector=query_vector,
                limit=limit_per_category,
                query_mode=query_mode,
            )
            all_results.extend(category_results)

        return all_results

    def get_document_chunks(
        self,
        *,
        category: str,
        document_id: str,
        limit: int = 2,
    ) -> list[dict]:
        collection_name = self._normalize_collection_name(category)
        if not self.collection_exists(collection_name):
            return []

        records, _ = self.client.scroll(
            collection_name=collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False,
        )

        chunks: list[dict] = []
        for record in records:
            payload = record.payload or {}
            chunks.append(
                {
                    "score": 0.0,
                    "text": payload.get("text", ""),
                    "document_id": payload.get("document_id", ""),
                    "document_title": payload.get("document_title", ""),
                    "document_name": payload.get("document_name", ""),
                    "document_type": payload.get("document_type", ""),
                    "legal_status": payload.get("legal_status", "actif"),
                    "date_publication": payload.get("date_publication"),
                    "date_entree_vigueur": payload.get("date_entree_vigueur"),
                    "version": payload.get("version", ""),
                    "relation_type": payload.get("relation_type", "none"),
                    "related_document_id": payload.get("related_document_id"),
                    "related_document_title": payload.get("related_document_title", ""),
                    "realized_at": payload.get("realized_at"),
                    "category": payload.get("category", category),
                    "chunk_index": payload.get("chunk_index", -1),
                }
            )

        return chunks
