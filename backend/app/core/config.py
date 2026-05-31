from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    embedding_model_name: str = "mxbai-embed-large:latest"

    chunk_size: int = 120
    chunk_overlap: int = 20

    ollama_base_url: str = "http://localhost:11434"
    generation_model_name: str = "llama3:latest"

    category_content_weight: float = 0.85
    category_name_weight: float = 0.15

    related_doc_chunks_limit: int = 2
    fallback_min_vector_score: float = 0.58
    fallback_max_answer_length: int = 240
    fallback_max_unsupported_tokens: int = 60

    # 5 chunks per category give a statistically stronger signal than 2
    category_probe_top_k: int = 5
    retrieval_top_k_per_category: int = 6
    final_top_k: int = 4
    # Reranker is applied on final_top_k × multiplier candidates before trimming to final_top_k.
    # This prevents the reranker from only reordering a pre-trimmed 4-chunk list: with 12
    # candidates it can rescue precise short chunks that were ranked lower by RRF.
    reranker_pool_multiplier: int = 3
    # Confidence level thresholds derived from cross-encoder mmarco-mMiniLMv2 score range.
    confidence_high_threshold: float = 0.70
    confidence_medium_threshold: float = 0.30

    rrf_retrieval_top_k: int = 20
    rrf_k_constant: int = 60
    min_rrf_score: float = 0.010
    min_rrf_final_score: float = 0.005
    # Legal modifier was calibrated for vector scores (0.5–1.0 range).
    # RRF scores are in [0.016, 0.033], so the raw modifier would dominate the
    # content signal by 4–18×.  This scale brings it back into proportion so
    # that RRF rank remains the primary ordering signal.
    rrf_legal_modifier_scale: float = 0.12
    # mmarco-mMiniLMv2 sigmoid output is in [0,1]; 0.30 rejects clearly off-topic chunks
    min_reranker_score: float = 0.30

    min_vector_score: float = 0.50
    min_lexical_score: float = 0.12
    min_final_score: float = 0.50

    temperature: float = 0.05
    top_p: float = 0.3
    # 512 tokens allows complete multi-article answers without truncation
    max_new_tokens: int = 512
    top_k: int = 20
    repetition_penalty: float = 1.1
    # llama3 supports 8192; 4096 prevents silent prompt truncation with no regression risk
    context_window: int = 4096

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "finance_rag"
    mongodb_documents_collection: str = "documents"
    mongodb_users_collection: str = "users"
    mongodb_sessions_collection: str = "auth_sessions"
    mongodb_chat_conversations_collection: str = "chat_conversations"
    mongodb_chat_messages_collection: str = "chat_messages"
    mongodb_reclamations_collection: str = "reclamations"
    mongodb_notifications_collection: str = "notifications"
    mongodb_document_favorites_collection: str = "document_favorites"
    documents_storage_dir: str = "storage/documents"
    reclamations_storage_dir: str = "storage/reclamations"

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
    auth_oidc_redirect_uri: str = "http://localhost:8000/api/auth/callback"
    auth_oidc_scope: str = "openid profile email"
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
