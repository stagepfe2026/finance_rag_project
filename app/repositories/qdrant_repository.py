# app/repositories/qdrant_repository.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.config import settings


class QdrantRepository:
    def __init__(self):
        self.client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)

    def ensure_collection(self, collection_name: str, vector_size: int):
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]

        # ✅ si existe → ne rien faire
        if collection_name in existing:
            return

        # ❌ sinon → créer
        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    def upsert_chunks(
        self,
        category: str,
        document_name: str,
        document_type: str,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> int:

        collection_name = category.lower().replace(" ", "_")

        # 🔥 créer si n'existe pas
        self.ensure_collection(collection_name, len(embeddings[0]))

        points = []

        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings)):
            points.append(
                PointStruct(
                    id=abs(hash(f"{document_name}-{idx}")),
                    vector=vector,
                    payload={
                        "document_name": document_name,
                        "document_type": document_type,
                        "category": category,
                        "chunk_index": idx,
                        "text": chunk,
                    },
                )
            )

        self.client.upsert(
            collection_name=collection_name,
            points=points
        )   
        return len(points)