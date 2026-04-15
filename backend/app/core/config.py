from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
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

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "finance_rag"
    mongodb_documents_collection: str = "documents"
    mongodb_users_collection: str = "users"
    mongodb_sessions_collection: str = "auth_sessions"
    mongodb_chat_conversations_collection: str = "chat_conversations"
    mongodb_chat_messages_collection: str = "chat_messages"
    mongodb_reclamations_collection: str = "reclamations"
    documents_storage_dir: str = "storage/documents"
    reclamations_storage_dir: str = "storage/reclamations"

    auth_mode: str = "local"
    auth_session_cookie_name: str = "rag_finance_session"
    auth_csrf_cookie_name: str = "rag_finance_csrf"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"
    auth_cookie_domain: str | None = None
    auth_session_idle_minutes: int = 30
    auth_session_absolute_hours: int = 8
    auth_access_token_minutes: int = 15
    auth_refresh_token_hours: int = 8
    auth_frontend_base_url: str = "http://localhost:5173"
    auth_oidc_issuer_url: str = "http://localhost:8080/realms/rag-finance"
    auth_oidc_client_id: str = "rag-finance-web"
    auth_oidc_client_secret: str = "change-me"
    auth_oidc_redirect_uri: str = "http://localhost:8000/api/v1/auth/callback"
    auth_oidc_scope: str = "openid profile email"
    auth_seed_default_users: bool = True
    auth_default_admin_email: str = "admin@finance.local"
    auth_default_admin_password: str = "Admin123!"
    auth_default_user_email: str = "user@finance.local"
    auth_default_user_password: str = "User123!"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
