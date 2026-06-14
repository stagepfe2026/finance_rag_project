import logging
import os

from app.core.config import settings
from sentence_transformers import CrossEncoder


class RerankerService:
    # Initialise le service et charge le modele de reranking si active.
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.model = None
        self.model_name = settings.reranker_model_name

        if not settings.reranker_enabled:
            self.logger.info("RerankerService disabled by configuration")
            return

        try:
            local_files_only = os.getenv("HF_HUB_OFFLINE", "").strip().lower() in {
                "1",
                "true",
                "yes",
            }
            self.model = CrossEncoder(self.model_name, local_files_only=local_files_only)
            self.logger.info("RerankerService loaded model: %s", self.model_name)
        except OSError as exc:
            self.logger.warning(
                "RerankerService model %s is unavailable; using retrieval-score fallback. "
                "Preload the model in the backend image or set RERANKER_ENABLED=false. Error: %s",
                self.model_name,
                exc,
            )

    # Reclasse les chunks par pertinence par rapport a la question via le modele CrossEncoder.
    def rerank(self, question: str, chunks: list[dict], top_k: int) -> list[dict]:
        if not chunks:
            return []

        if self.model is None:
            return self._fallback_rerank(chunks, top_k)

        pairs = [(question, chunk["text"]) for chunk in chunks]
        scores = self.model.predict(pairs)

        for chunk, score in zip(chunks, scores, strict=False):
            chunk["reranker_score"] = float(score)

        reranked = sorted(chunks, key=lambda c: c["reranker_score"], reverse=True)
        return reranked[:top_k]

    # Reclasse les chunks en utilisant les scores existants quand le modele est indisponible.
    def _fallback_rerank(self, chunks: list[dict], top_k: int) -> list[dict]:
        for chunk in chunks:
            fallback_score = max(
                float(chunk.get("final_score", 0.0)),
                float(chunk.get("vector_score", 0.0)),
                float(chunk.get("rrf_score", 0.0)),
            )
            chunk["reranker_score"] = min(fallback_score, 1.0)

        reranked = sorted(chunks, key=lambda c: c["reranker_score"], reverse=True)
        return reranked[:top_k]
