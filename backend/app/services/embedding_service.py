# app/services/embedding_service.py
from app.infrastructure.embeddings.ollama_embedding_provider import (
    OllamaEmbeddingProvider,
)


class EmbeddingService:
    def __init__(self, provider: OllamaEmbeddingProvider):
        self.provider = provider

    def generate_embeddings(self, chunks: list[str]) -> list[list[float]]:
        return self.provider.embed_texts(chunks)
