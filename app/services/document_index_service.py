# app/services/document_index_service.py
import os
import tempfile

from fastapi import UploadFile

from app.core.config import settings
from app.services.document_parser_service import DocumentParserService
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.repositories.qdrant_repository import QdrantRepository


class DocumentIndexService:
    def __init__(self, embedding_service: EmbeddingService):
        self.parser_service = DocumentParserService()
        self.chunking_service = ChunkingService(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap
        )
        self.embedding_service = embedding_service
        self.qdrant_repository = QdrantRepository()

    async def index_document(self, file: UploadFile, category: str) -> dict:
        extension = os.path.splitext(file.filename)[1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            text = self.parser_service.parse_document(temp_file_path, extension)

            if not text.strip():
                raise ValueError("Le document est vide ou le texte n'a pas pu être extrait.")

            chunks = self.chunking_service.chunk_text(text)

            if not chunks:
                raise ValueError("Aucun chunk généré à partir du document.")

            embeddings = self.embedding_service.generate_embeddings(chunks)

            inserted_count = self.qdrant_repository.upsert_chunks(
                category=category,
                document_name=file.filename,
                document_type=extension.replace(".", ""),
                chunks=chunks,
                embeddings=embeddings,
            )

            return {
                "document_name": file.filename,
                "category": category,
                "document_type": extension.replace(".", ""),
                "chunks_count": len(chunks),
                "indexed_points": inserted_count,
            }

        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)