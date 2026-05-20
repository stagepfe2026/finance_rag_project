from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.services.documents.indexing.document_parser_service import DocumentParserService
from app.services.documents.legal.legal_status_service import LegalStatusService
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.rag.processing.nlp_service import NLPService


class DocumentPipelineService:
    def __init__(
        self,
        document_parser_service: DocumentParserService,
        nlp_service: NLPService,
        embedding_service: EmbeddingService,
        qdrant_repository: QdrantRepository,
        document_repository: DocumentRepository,
        legal_status_service: LegalStatusService,
    ) -> None:
        self.parser_service = document_parser_service
        self.nlp_service = nlp_service
        self.embedding_service = embedding_service
        self.qdrant_repository = qdrant_repository
        self.document_repository = document_repository
        self.legal_status_service = legal_status_service

    def parse_and_chunk(self, file_path: str, extension: str) -> tuple[str, list[str]]:
        raw_text = self.parser_service.parse_document(file_path, extension)
        cleaned_text = self.nlp_service.preprocess_document(raw_text)

        if not cleaned_text.strip():
            raise ValueError("Le document est vide ou le texte n a pas pu etre extrait.")

        chunks = self.nlp_service.prepare_chunks(cleaned_text)
        if not chunks:
            raise ValueError("Aucun chunk genere a partir du document.")

        return cleaned_text, chunks

    def embed_and_upsert(
        self,
        *,
        category: str,
        document_id: str,
        document_title: str,
        document_name: str,
        document_type: str,
        legal_status: str,
        date_publication: str | None,
        date_entree_vigueur: str | None,
        version: str,
        relation_type: str,
        related_document_id: str | None,
        related_document_title: str | None,
        realized_at: str | None,
        chunks: list[str],
    ) -> int:
        embeddings = self.embedding_service.generate_embeddings(chunks)
        inserted_count = self.qdrant_repository.save_chunks(
            category=category,
            document_id=document_id,
            document_title=document_title,
            document_name=document_name,
            document_type=document_type,
            legal_status=legal_status,
            date_publication=date_publication,
            date_entree_vigueur=date_entree_vigueur,
            version=version,
            relation_type=relation_type,
            related_document_id=related_document_id,
            related_document_title=related_document_title,
            realized_at=realized_at,
            chunks=chunks,
            embeddings=embeddings,
        )
        return inserted_count

    def run_pipeline(
        self,
        *,
        file_path: str,
        extension: str,
        category: str,
        document_id: str,
        document_title: str,
        document_name: str,
        document_type: str,
        legal_status: str,
        date_publication: str | None,
        date_entree_vigueur: str | None,
        version: str,
        relation_type: str,
        related_document_id: str | None,
        related_document_title: str | None,
        realized_at: str | None,
    ) -> tuple[str, list[str], int]:
        cleaned_text, chunks = self.parse_and_chunk(file_path, extension)
        inserted_count = self.embed_and_upsert(
            category=category,
            document_id=document_id,
            document_title=document_title,
            document_name=document_name,
            document_type=document_type,
            legal_status=legal_status,
            date_publication=date_publication,
            date_entree_vigueur=date_entree_vigueur,
            version=version,
            relation_type=relation_type,
            related_document_id=related_document_id,
            related_document_title=related_document_title,
            realized_at=realized_at,
            chunks=chunks,
        )
        return cleaned_text, chunks, inserted_count
