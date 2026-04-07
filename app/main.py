# main.py
from app.api.v1.controllers.document_controller import router as document_router
from app.api.v1.controllers.rag_controller import router as rag_router
from app.core.config import settings
from app.infrastructure.embeddings.qwen_embedding_provider import QwenEmbeddingProvider
from app.infrastructure.generation.ollama_generation_provider import OllamaGenerationProvider
from app.services.document_index_service import DocumentIndexService
from app.services.embedding_service import EmbeddingService
from app.services.generation_service import GenerationService
from app.services.rag_service import RagService
from fastapi import FastAPI

app = FastAPI(
    title="Document Indexing API",
    version="1.0.0",
    description="API d'indexation de documents PDF/DOCX vers Qdrant avec Qwen Embedding",
)


@app.on_event("startup")
async def startup_event():
    print(">>> Startup: initialisation du modèle d'embedding...")

    provider = QwenEmbeddingProvider(settings.embedding_model_name)
    embedding_service = EmbeddingService(provider)
    document_index_service = DocumentIndexService(embedding_service)

    print(">>> Startup: initialisation du service d'indexation...")
    document_index_service = DocumentIndexService(embedding_service)

    print(">>> Startup: initialisation du modèle de génération...")
    generation_provider = OllamaGenerationProvider(
        base_url=settings.ollama_base_url,
        model_name=settings.generation_model_name,
    )
    generation_service = GenerationService(generation_provider)

    print(">>> Startup: initialisation du service RAG...")
    rag_service = RagService(
        embedding_service=embedding_service,
        generation_service=generation_service,
    )

    app.state.document_index_service = document_index_service
    app.state.rag_service = rag_service

    print(">>> Startup: document_index_service initialisé avec succès.")


app.include_router(document_router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(rag_router, prefix="/api/v1/rag", tags=["RAG"])
