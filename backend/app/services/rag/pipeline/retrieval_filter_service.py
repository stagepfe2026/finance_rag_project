from typing import Literal

from app.core.config import settings
from app.services.rag.processing.nlp_service import NLPService


class RetrievalFilterService:
    def __init__(self, nlp_service: NLPService):
        self.nlp_service = nlp_service

    def _filter_relevant_chunks(self, ranked_chunks: list[dict]) -> list[dict]:
        return [
            chunk
            for chunk in ranked_chunks
            if chunk["vector_score"] >= settings.min_vector_score
            and chunk["lexical_score"] >= settings.min_lexical_score
            and chunk["final_score"] >= settings.min_final_score
        ]

    def _filter_relevant_chunks_rrf(self, ranked_chunks: list[dict]) -> list[dict]:
        return [
            chunk for chunk in ranked_chunks
            if chunk["rrf_score"] >= settings.min_rrf_score
            and chunk["final_score"] >= settings.min_rrf_final_score
        ]

    @staticmethod
    def _dedupe_chunks(chunks: list[dict]) -> list[dict]:
        deduped: list[dict] = []
        seen_keys: set[tuple[str, int]] = set()

        for chunk in chunks:
            key = (
                str(chunk.get("document_id", "")).strip(),
                int(chunk.get("chunk_index", -1)),
            )
            if key in seen_keys:
                continue
            seen_keys.add(key)
            deduped.append(chunk)

        return deduped

    @staticmethod
    def _filter_current_applicable_chunks(chunks: list[dict]) -> list[dict]:
        return [
            chunk
            for chunk in chunks
            if str(chunk.get("legal_status", "actif")).strip() == "actif"
        ]

    def _build_final_chunks(
        self,
        *,
        main_relevant_chunks: list[dict],
        related_relevant_chunks: list[dict],
        related_ranked_chunks: list[dict],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        if query_mode == "current" and question_profile not in {"historical", "comparative"}:
            current_main_chunks = self._filter_current_applicable_chunks(main_relevant_chunks)
            if current_main_chunks:
                return self._dedupe_chunks(current_main_chunks)[: settings.final_top_k]

        is_comparison_context = query_mode == "comparison" or question_profile in {
            "historical",
            "comparative",
        }
        if not is_comparison_context:
            return self._dedupe_chunks(main_relevant_chunks)[: settings.final_top_k]

        effective_related_chunks = related_relevant_chunks
        if (
            (query_mode == "comparison" or question_profile == "comparative")
            and not effective_related_chunks
            and related_ranked_chunks
        ):
            effective_related_chunks = related_ranked_chunks[:1]

        if not effective_related_chunks:
            return self._dedupe_chunks(main_relevant_chunks)[: settings.final_top_k]

        main_limit = max(2, settings.final_top_k - 2)
        related_limit = min(2, settings.final_top_k - 1)
        if query_mode == "comparison" or question_profile == "comparative":
            related_limit = max(1, related_limit)

        selected_main = main_relevant_chunks[:main_limit]
        selected_related = effective_related_chunks[:related_limit]
        merged_chunks = self._dedupe_chunks(selected_main + selected_related)

        if len(merged_chunks) < settings.final_top_k:
            remaining_chunks = self._dedupe_chunks(main_relevant_chunks + effective_related_chunks)
            existing_keys = {
                (str(chunk.get("document_id", "")).strip(), int(chunk.get("chunk_index", -1)))
                for chunk in merged_chunks
            }
            for chunk in remaining_chunks:
                key = (str(chunk.get("document_id", "")).strip(), int(chunk.get("chunk_index", -1)))
                if key in existing_keys:
                    continue
                merged_chunks.append(chunk)
                existing_keys.add(key)
                if len(merged_chunks) >= settings.final_top_k:
                    break

        merged_chunks.sort(key=lambda item: item["final_score"], reverse=True)
        return merged_chunks[: settings.final_top_k]

    def _needs_fallback(self, answer: str, final_chunks: list[dict]) -> bool:
        cleaned_answer = answer.strip()
        if not cleaned_answer:
            return True

        lowered_answer = cleaned_answer.lower()
        if lowered_answer == "information non trouvee dans les sources fournies.":
            return False

        best_reranker_score = max(chunk.get("reranker_score", 0.0) for chunk in final_chunks)
        best_vector_score = max(chunk.get("vector_score", 0.0) for chunk in final_chunks)

        if best_reranker_score >= settings.min_reranker_score or best_vector_score >= settings.fallback_min_vector_score:
            return False

        context_text = " ".join(chunk["text"] for chunk in final_chunks).lower()
        answer_tokens = [
            token
            for token in self.nlp_service.provider.tokenize_words(lowered_answer)
            if len(token) > 5
        ]
        unsupported_tokens = [token for token in answer_tokens if token not in context_text]

        if len(cleaned_answer) <= settings.fallback_max_answer_length:
            return False

        return len(unsupported_tokens) > settings.fallback_max_unsupported_tokens
