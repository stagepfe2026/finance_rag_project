# app/services/rag/processing/embedding_service.py
from app.infrastructure.embeddings.base_embedding_provider import BaseEmbeddingProvider


class EmbeddingService:
    # Initialise le service avec le fournisseur d'embeddings.
    def __init__(self, provider: BaseEmbeddingProvider):
        self.provider = provider

    # Genere les vecteurs d'embeddings pour une liste de textes.
    def generate_embeddings(self, chunks: list[str]) -> list[list[float]]:
        return self.provider.embed(chunks)
