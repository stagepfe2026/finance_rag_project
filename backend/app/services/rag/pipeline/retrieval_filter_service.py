from __future__ import annotations

import logging
import re
from typing import Literal

from app.core.config import settings
from app.core.rag_messages import MSG_OUT_OF_DOMAIN, MSG_UNRELIABLE
from app.services.rag.processing.nlp_service import NLPService

logger = logging.getLogger(__name__)

# Motifs numeriques a risque dans les textes juridiques/financiers.
# Les entiers seuls sont trop frequents pour etre valides de facon fiable.
_NUMERIC_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b\d+(?:[.,]\d+)?\s*%"),  # pourcentages: 2%, 50%, 3,5%
    re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:dinars?|DT|TND)\b", re.IGNORECASE),  # montants: 500 DT
    re.compile(r"\bArticle\s+\d+(?:bis|ter|quater)?\b", re.IGNORECASE),  # numeros d'articles
    re.compile(r"\bArt\.\s*\d+\b", re.IGNORECASE),  # articles abreges
]

# Normalise "2 %" en "2%" pour eviter les faux ecarts lies aux espaces.
_PERCENT_SPACE_RE = re.compile(r"(\d)\s+%")


def _normalize_numbers(text: str) -> str:
    return _PERCENT_SPACE_RE.sub(r"\1%", text)


class RetrievalFilterService:
    def __init__(self, nlp_service: NLPService):
        self.nlp_service = nlp_service

    def _filter_relevant_chunks(self, ranked_chunks: list[dict]) -> list[dict]:
        # .get() evite un KeyError sur les chunks lies scores sans lexical_score.
        candidates = [
            chunk
            for chunk in ranked_chunks
            if chunk.get("vector_score", 0.0) >= settings.min_vector_score
            and chunk.get("lexical_score", 0.0) >= settings.min_lexical_score
            and chunk.get("final_score", 0.0) >= settings.min_final_score
        ]
        return self._apply_relative_threshold(candidates)

    def _filter_relevant_chunks_rrf(self, ranked_chunks: list[dict]) -> list[dict]:
        candidates = [
            chunk for chunk in ranked_chunks
            if chunk.get("rrf_score", 0.0) >= settings.min_rrf_score
            and chunk.get("final_score", 0.0) >= settings.min_rrf_final_score
        ]
        return self._apply_relative_threshold(candidates)

    def _filter_relevant_chunks_vector(self, ranked_chunks: list[dict]) -> list[dict]:
        """Filtre les chunks scores uniquement par vecteur, sans BM25/RRF.

        Les chunks des documents lies n'ont pas lexical_score ni rrf_score.
        Ce filtre utilise donc seulement vector_score et final_score.
        """
        candidates = [
            chunk for chunk in ranked_chunks
            if chunk.get("vector_score", 0.0) >= settings.min_vector_score
            and chunk.get("final_score", 0.0) >= settings.min_final_score
        ]
        return self._apply_relative_threshold(candidates)

    @staticmethod
    def _apply_relative_threshold(chunks: list[dict]) -> list[dict]:
        """Retire les chunks trop faibles par rapport au meilleur resultat.

        Le seuil relatif evite de garder des chunks peu competitifs quand le
        meilleur score est beaucoup plus haut que les autres.
        """
        if not chunks:
            return []
        best = max(c.get("final_score", 0.0) for c in chunks)
        if best <= 0:
            return chunks
        cutoff = best * 0.40
        return [c for c in chunks if c.get("final_score", 0.0) >= cutoff]

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

    @staticmethod
    def _has_unsupported_numbers(
        answer: str,
        final_chunks: list[dict],
        extra_trusted_text: str = "",
    ) -> bool:
        """Return True when a legally-sensitive number in the answer is absent from context.

        Only specific high-risk formats are checked (percentages, monetary amounts,
        article numbers). Bare integers are deliberately excluded to avoid
        over-triggering on dates, list indices, etc.

        Article numbers accept both singular and plural forms in context
        ("article 81" matches "articles 81") to avoid false positives when
        the LLM uses singular form for an article referenced in plural in the chunks.

        extra_trusted_text: previous conversation exchange. Numbers that appear
        there were already validated and must not re-trigger the fallback.
        """
        context_raw = " ".join(chunk["text"] for chunk in final_chunks)
        if extra_trusted_text:
            context_raw = context_raw + " " + extra_trusted_text
        normalized_context = _normalize_numbers(context_raw)
        normalized_answer = _normalize_numbers(answer)

        for pattern in _NUMERIC_PATTERNS:
            for match in pattern.finditer(normalized_answer):
                value = match.group(0).strip()
                num_match = re.search(r"\d+", value)
                # For article/Art. patterns use a plural-tolerant context search.
                if num_match and re.match(r"art(?:icle)?\b", value, re.IGNORECASE):
                    num = re.escape(num_match.group(0))
                    flexible = re.compile(
                        r"\barticles?\s+" + num + r"(?:bis|ter|quater)?\b"
                        r"|\bArt\.\s*" + num + r"\b",
                        re.IGNORECASE,
                    )
                    if not flexible.search(normalized_context):
                        logger.debug(
                            "_has_unsupported_numbers: article number %r not found in context",
                            value,
                        )
                        return True
                else:
                    if not re.search(re.escape(value), normalized_context, re.IGNORECASE):
                        logger.debug(
                            "_has_unsupported_numbers: value %r not found in context",
                            value,
                        )
                        return True
        return False

    def _needs_fallback(
        self,
        answer: str,
        final_chunks: list[dict],
        extra_trusted_text: str = "",
    ) -> bool:
        cleaned_answer = answer.strip()
        if not cleaned_answer:
            return True

        lowered_answer = cleaned_answer.lower()
        if lowered_answer in {MSG_OUT_OF_DOMAIN.lower(), MSG_UNRELIABLE.lower()}:
            return False

        best_reranker_score = max(chunk.get("reranker_score", 0.0) for chunk in final_chunks)
        best_vector_score = max(chunk.get("vector_score", 0.0) for chunk in final_chunks)

        both_strong = (
            best_reranker_score >= settings.min_reranker_score
            and best_vector_score >= settings.fallback_min_vector_score
        )

        if both_strong:
            # Confiance forte: on verifie seulement l'ancrage numerique.
            if self._has_unsupported_numbers(cleaned_answer, final_chunks, extra_trusted_text):
                logger.warning(
                    "_needs_fallback: unsupported numbers (both_strong) reranker=%.4f vector=%.4f",
                    best_reranker_score,
                    best_vector_score,
                )
                return True
            return False

        # Signal faible: on applique des controles de contenu plutot qu'un rejet automatique.
        # Le reranker peut sous-noter du texte juridique FR/AR meme si les chunks sont bons.
        if self._has_unsupported_numbers(cleaned_answer, final_chunks, extra_trusted_text):
            logger.warning(
                "_needs_fallback: unsupported numbers (weak signals) reranker=%.4f vector=%.4f",
                best_reranker_score,
                best_vector_score,
            )
            return True

        # Une reponse courte reste acceptable meme avec un contexte moins fort.
        if len(cleaned_answer) <= settings.fallback_max_answer_length:
            return False

        context_text = " ".join(chunk["text"] for chunk in final_chunks).lower()
        answer_tokens = [
            token
            for token in self.nlp_service.provider.tokenize_words(lowered_answer)
            if len(token) > 5
        ]
        unsupported_tokens = [token for token in answer_tokens if token not in context_text]
        result = len(unsupported_tokens) > settings.fallback_max_unsupported_tokens
        if result:
            logger.warning(
                "_needs_fallback: token overlap (weak signals) reranker=%.4f vector=%.4f "
                "unsupported=%d/%d threshold=%d",
                best_reranker_score,
                best_vector_score,
                len(unsupported_tokens),
                len(answer_tokens),
                settings.fallback_max_unsupported_tokens,
            )
        else:
            logger.info(
                "_needs_fallback: passed all gates reranker=%.4f vector=%.4f "
                "unsupported=%d/%d",
                best_reranker_score,
                best_vector_score,
                len(unsupported_tokens),
                len(answer_tokens),
            )
        return result
