from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import NLPProvider
from app.services.chunking_service import ChunkingService


class NLPService:
    def __init__(self, provider: NLPProvider):
        self.provider = provider
        self.chunking_service = ChunkingService(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )

    def preprocess_document(self, text: str) -> str:
        return self.provider.clean_text(text)

    def extract_document_structure(self, text: str) -> dict:
        cleaned_text = self.preprocess_document(text)
        articles = self.provider.detect_articles(cleaned_text)
        structure_type = self.provider.detect_document_structure(cleaned_text)

        return {
            "structure_type": structure_type,
            "articles": articles,
            "articles_count": len(articles),
        }

    def prepare_chunks(self, text: str) -> list[str]:
        cleaned_text = self.preprocess_document(text)
        article_chunks = self.provider.chunk_by_article(cleaned_text)
        if article_chunks:
            normalized_chunks: list[str] = []
            for chunk in article_chunks:
                split_chunks = self.chunking_service.chunk_text(chunk)
                normalized_chunks.extend(split_chunks or [chunk])
            return normalized_chunks

        return self.chunking_service.chunk_text(cleaned_text)

    def preprocess_query(self, text: str) -> str:
        return self.provider.clean_text(text)

    def tokenize_for_lexical_search(self, text: str) -> set[str]:
        cleaned_text = self.preprocess_query(text)
        tokens = self.provider.tokenize_words(cleaned_text)
        filtered_tokens = self.provider.remove_stopwords(tokens)
        return {token for token in filtered_tokens if len(token) > 2}
