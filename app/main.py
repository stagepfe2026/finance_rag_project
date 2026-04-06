# main.py
from fastapi import FastAPI

from app.api.v1.controllers.document_controller import router as document_router
from app.core.config import settings
from app.infrastructure.embeddings.qwen_embedding_provider import QwenEmbeddingProvider
from app.services.embedding_service import EmbeddingService
from app.services.document_index_service import DocumentIndexService

app = FastAPI(
    title="Document Indexing API",
    version="1.0.0",
    description="API d'indexation de documents PDF/DOCX vers Qdrant avec Qwen Embedding"
)


@app.on_event("startup")
async def startup_event():
    print(">>> Startup: initialisation du modèle d'embedding...")

    provider = QwenEmbeddingProvider(settings.embedding_model_name)
    embedding_service = EmbeddingService(provider)
    document_index_service = DocumentIndexService(embedding_service)

    app.state.document_index_service = document_index_service

    print(">>> Startup: document_index_service initialisé avec succès.")


app.include_router(document_router, prefix="/api/v1/documents", tags=["Documents"])