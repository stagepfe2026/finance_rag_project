from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Connexion Qdrant: en Docker, l'hote devient "qdrant" via .env.docker.
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    embedding_model_name: str = "mxbai-embed-large:latest"

    # Taille des morceaux de texte envoyes au moteur RAG.
    chunk_size: int = 120
    chunk_overlap: int = 20

    # Modeles Ollama utilises pour les embeddings et la generation.
    ollama_base_url: str = "http://localhost:11434"
    generation_model_name: str = "llama3:latest"

    # Pondération pour choisir la meilleure categorie documentaire.
    category_content_weight: float = 0.85
    category_name_weight: float = 0.15

    # Seuils de prudence pour eviter les reponses non appuyees par les sources.
    related_doc_chunks_limit: int = 2
    fallback_min_vector_score: float = 0.58
    fallback_max_answer_length: int = 240
    fallback_max_unsupported_tokens: int = 60

    # 5 chunks par categorie donnent un signal plus stable que 2.
    category_probe_top_k: int = 5
    retrieval_top_k_per_category: int = 6
    final_top_k: int = 4
    # Le reranker analyse final_top_k x multiplier candidats avant le dernier filtrage.
    # Cela lui permet de recuperer un chunk precis classe trop bas par le scoring initial.
    reranker_pool_multiplier: int = 3
    reranker_enabled: bool = True
    reranker_model_name: str = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"
    # Seuils de confiance calibres sur les scores du cross-encoder.
    confidence_high_threshold: float = 0.70
    confidence_medium_threshold: float = 0.30

    # Parametres du classement hybride dense + BM25 via RRF.
    rrf_retrieval_top_k: int = 20
    rrf_k_constant: int = 60
    min_rrf_score: float = 0.010
    min_rrf_final_score: float = 0.005
    # Le bonus juridique est reduit pour ne pas dominer le rang RRF.
    rrf_legal_modifier_scale: float = 0.12
    # Sortie sigmoid dans [0,1]; 0.30 rejette les chunks clairement hors sujet.
    min_reranker_score: float = 0.30

    # Seuils de pertinence avant construction du contexte final.
    min_vector_score: float = 0.50
    min_lexical_score: float = 0.12
    min_final_score: float = 0.50

    # Parametres de generation: faibles temperature/top_p pour des reponses juridiques stables.
    temperature: float = 0.05
    top_p: float = 0.3
    # 512 tokens permettent une reponse multi-articles sans coupure excessive.
    max_new_tokens: int = 512
    top_k: int = 20
    repetition_penalty: float = 1.1
    # 4096 limite les prompts trop longs tout en restant compatible avec llama3.
    context_window: int = 4096

    # Collections MongoDB utilisees par les differents modules.
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

    # Cookies et durees de session locale.
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
    # Configuration OIDC/SSO; garde des valeurs locales par defaut pour le developpement.
    auth_oidc_issuer_url: str = "http://localhost:8080/realms/rag-finance"
    auth_oidc_client_id: str = "rag-finance-web"
    auth_oidc_client_secret: str = "change-me"
    auth_oidc_redirect_uri: str = "http://localhost:8000/api/auth/callback"
    auth_oidc_scope: str = "openid profile email"
    model_config = SettingsConfigDict(
        # En local, Pydantic charge .env; en Docker, docker-compose injecte .env.docker.
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
