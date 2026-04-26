from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.controllers.auth_controller import router as auth_router
from app.api.v1.controllers.audit_controller import router as audit_router
from app.api.v1.controllers.chat_controller import router as chat_router
from app.api.v1.controllers.dashboard_controller import router as dashboard_router
from app.api.v1.controllers.document_controller import router as document_router
from app.api.v1.controllers.document_search_controller import router as document_search_router
from app.api.v1.controllers.notification_controller import router as notification_router
from app.api.v1.controllers.rag_controller import router as rag_router
from app.api.v1.controllers.reclamation_controller import router as reclamation_router
from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.infrastructure.embeddings.ollama_embedding_provider import (
    OllamaEmbeddingProvider,
)
from app.infrastructure.generation.ollama_generation_provider import OllamaGenerationProvider
from app.middlewares.auth_session_middleware import AuthSessionMiddleware
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.services.chat_service import ChatService
from app.services.document_index_service import DocumentIndexService
from app.services.dashboard_service import DashboardService
from app.services.embedding_service import EmbeddingService
from app.services.generation_service import GenerationService
from app.services.notification_service import NotificationConnectionManager, NotificationService
from app.services.rag_service import RagService
from app.services.reclamation_service import ReclamationService


auth_service = AuthService()
notification_manager = NotificationConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    auth_service.ensure_auth_indexes()
    auth_service.seed_default_users()

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
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthSessionMiddleware)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(audit_router, prefix="/api/v1/audit", tags=["Audit"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(dashboard_router)
app.include_router(document_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(document_search_router, prefix="/api/v1/document-search", tags=["DocumentSearch"])
app.include_router(notification_router)
app.include_router(reclamation_router, prefix="/api/v1/reclamations", tags=["Reclamations"])
app.include_router(rag_router, prefix="/api/v1/rag", tags=["RAG"])
