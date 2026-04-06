# app/services/embedding_service.py
from app.infrastructure.embeddings.qwen_embedding_provider import QwenEmbeddingProvider


class EmbeddingService:
    def __init__(self, provider: QwenEmbeddingProvider):
        self.provider = provider

    def generate_embeddings(self, chunks: list[str]) -> list[list[float]]:
        return self.provider.embed_texts(chunks)