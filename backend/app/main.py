import os

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

from contextlib import asynccontextmanager

from app.api.routers.audit_router import router as audit_router
from app.api.routers.auth_router import router as auth_router
from app.api.routers.chat_router import router as chat_router
from app.api.routers.dashboard_router import router as dashboard_router
from app.api.routers.document_router import router as document_router
from app.api.routers.document_search_router import router as document_search_router
from app.api.routers.notification_router import router as notification_router
from app.api.routers.rag_router import router as rag_router
from app.api.routers.reclamation_router import router as reclamation_router
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.infrastructure.database.mongodb_validator_manager import ensure_mongodb_validators
from app.infrastructure.embeddings.ollama_embedding_provider import (
    OllamaEmbeddingProvider,
)
from app.infrastructure.generation.ollama_generation_provider import OllamaGenerationProvider
from app.middlewares.auth_session_middleware import AuthSessionMiddleware
from app.services.audit.audit_service import AuditService
from app.services.auth.auth_service import AuthService
from app.services.chat.chat_service import ChatService
from app.services.dashboard.dashboard_service import DashboardService
from app.services.documents.indexing.document_index_service import DocumentIndexService
from app.services.notifications.notification_service import NotificationConnectionManager, NotificationService
from app.services.rag.generation.generation_service import GenerationService
from app.services.rag.pipeline.rag_service import RagService
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.reclamations.reclamation_service import ReclamationService
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

auth_service = AuthService()
notification_manager = NotificationConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    ensure_mongodb_validators(get_database())
    auth_service.setup_indexes()
    auth_service.create_default_accounts()

    provider = OllamaEmbeddingProvider(
        base_url=settings.ollama_base_url,
        model_name=settings.embedding_model_name,
    )
    embedding_service = EmbeddingService(provider)
    notification_service = NotificationService(notification_manager)
    notification_service.ensure_indexes()
    document_index_service = DocumentIndexService(
        embedding_service,
        notification_service=notification_service,
    )

    generation_provider = OllamaGenerationProvider(
        base_url=settings.ollama_base_url,
        model_name=settings.generation_model_name,
    )
    generation_service = GenerationService(generation_provider)

    rag_service = RagService(
        embedding_service=embedding_service,
        generation_service=generation_service,
    )
    chat_service = ChatService(rag_service)
    chat_service.ensure_indexes()

    reclamation_service = ReclamationService(notification_service=notification_service)
    reclamation_service.ensure_indexes()
    audit_service = AuditService()
    dashboard_service = DashboardService(notification_service)

    app.state.document_index_service = document_index_service
    app.state.rag_service = rag_service
    app.state.chat_service = chat_service
    app.state.reclamation_service = reclamation_service
    app.state.audit_service = audit_service
    app.state.auth_service = auth_service
    app.state.notification_service = notification_service
    app.state.dashboard_service = dashboard_service

    yield

    close_mongo_connection()


app = FastAPI(
    title="Document Indexing API",
    version="1.0.0",
    description="API d indexation de documents et d authentification pour rag_finance.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthSessionMiddleware)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(audit_router, prefix="/api/audit", tags=["Audit"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(dashboard_router)
app.include_router(document_router, prefix="/api/documents", tags=["Documents"])
app.include_router(document_search_router, prefix="/api/document-search", tags=["DocumentSearch"])
app.include_router(notification_router)
app.include_router(reclamation_router, prefix="/api/reclamations", tags=["Reclamations"])
app.include_router(rag_router, prefix="/api/rag", tags=["RAG"])
