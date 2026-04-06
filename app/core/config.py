# app/core/config.py
from pydantic import BaseModel


class Settings(BaseModel):
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "ministere_docs"
    embedding_model_name: str = "Qwen/Qwen3-Embedding-0.6B"
    chunk_size: int = 500
    chunk_overlap: int = 50


settings = Settings()