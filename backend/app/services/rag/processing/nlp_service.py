from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider
from app.services.rag.processing.chunking_service import ChunkingService


class NLPService:
    def __init__(self, provider: FrenchNlpProvider):
        self.provider = provider
        self.chunking_service = ChunkingService(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

    def preprocess_document(self, text: str) -> str:
        return self.provider.clean_text(text)

    def prepare_chunks(self, text: str) -> list[str]:
        cleaned_text = self.preprocess_document(text)
        article_chunks = self.provider.chunk_by_article(cleaned_text)
        if article_chunks:
            normalized_chunks: list[str] = []
            for article_raw in article_chunks:
                # Preserve the article identifier in every continuation sub-chunk so
                # retrieval can match "quel article fixe X" against any sub-chunk,
                # not only the first one that naturally starts with the article header.
                article_header = self.provider.extract_article_header(article_raw)
                split_chunks = self.chunking_service.chunk_text(article_raw)
                for sub_idx, sub_chunk in enumerate(split_chunks or [article_raw]):
                    if sub_idx > 0 and article_header:
                        sub_chunk = f"[{article_header}] {sub_chunk}"
                    normalized_chunks.append(sub_chunk)
            return normalized_chunks

        return self.chunking_service.chunk_text(cleaned_text)

    def preprocess_query(self, text: str) -> str:
        return self.provider.clean_text(text)

    def tokenize_for_lexical_search(self, text: str) -> set[str]:
        return self.provider.tokenize_for_lexical_search(text)
