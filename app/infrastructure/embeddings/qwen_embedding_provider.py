# app/infrastructure/embeddings/qwen_embedding_provider.py
from sentence_transformers import SentenceTransformer


class QwenEmbeddingProvider:
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name, device="cpu")

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return [emb.tolist() for emb in embeddings]