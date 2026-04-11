from app.core.config import settings
from qdrant_client import QdrantClient
from qdrant_client.models import (
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
        document_name: str,
        document_type: str,
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
                        "document_name": document_name,
                        "document_type": document_type,
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
    ) -> list[dict]:
        collection_name = self._normalize_collection_name(category)

        if not self.collection_exists(collection_name):
            return []

        response = self.client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=limit,
        )

        points = response.points if hasattr(response, "points") else []

        chunks = []
        for point in points:
            payload = point.payload or {}
            chunks.append(
                {
                    "score": point.score,
                    "text": payload.get("text", ""),
                    "document_name": payload.get("document_name", ""),
                    "document_type": payload.get("document_type", ""),
                    "category": payload.get("category", category),
                    "chunk_index": payload.get("chunk_index", -1),
                }
            )

        return chunks

    def search_chunks_by_category(
        self,
        categories: str,
        query_vector: list[float],
        limit_per_category: int,
    ) -> list[dict]:
        all_results = []
        for category in categories:
            category_results = self.search_chunks(
                category=category,
                query_vector=query_vector,
                limit=limit_per_category,
            )
            all_results.extend(category_results)

        return all_results
