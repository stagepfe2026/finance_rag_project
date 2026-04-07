from pydantic import BaseModel


class Settings(BaseModel):
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "ministere_docs"
    embedding_model_name: str = "Qwen/Qwen3-Embedding-0.6B"

    chunk_size: int = 120
    chunk_overlap: int = 20

    retrivel_top_k: int = 6
    max_context_chunks: int = 3
    ollama_base_url: str = "http://localhost:11434"
    generation_model_name: str = "llama3:latest"

    category_probe_top_k: int = 2
    retrieval_top_k_per_category: int = 4
    final_top_k: int = 3
    max_categories: int = 1

    min_vector_score: float = 0.55
    min_lexical_score: float = 0.20
    min_final_score: float = 0.58

    temperature: float = 0.05
    top_p: float = 0.3
    max_new_tokens: int = 300
    top_k: int = 20
    repetition_penalty: float = 1.1
    context_window: int = 2048


settings = Settings()
