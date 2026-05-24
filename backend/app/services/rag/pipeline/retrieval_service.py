import logging
from typing import Literal

from app.core.config import settings
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.rag.processing.nlp_service import NLPService
from app.services.rag.ranking.bm25_service import BM25Service
from app.services.rag.ranking.legal_ranking_service import LegalRankingService


class RetrievalService:
    def __init__(
        self,
        qdrant_repository: QdrantRepository,
        document_repository: DocumentRepository,
        nlp_service: NLPService,
        embedding_service: EmbeddingService,
        bm25_service: type[BM25Service],
        legal_ranking_service: LegalRankingService,
    ):
        self.qdrant_repository = qdrant_repository
        self.document_repository = document_repository
        self.nlp_service = nlp_service
        self.embedding_service = embedding_service
        self.bm25_service_class = bm25_service
        self.legal_ranking_service = legal_ranking_service
        self.logger = logging.getLogger(__name__)

    def _tokenize(self, text: str) -> set[str]:
        return self.nlp_service.tokenize_for_lexical_search(text)

    def _compute_lexical_overlap_score(self, question: str, chunk_text: str) -> float:
        question_tokens = self._tokenize(question)
        chunk_tokens = self._tokenize(chunk_text)

        if not question_tokens or not chunk_tokens:
            return 0.0

        overlap = question_tokens.intersection(chunk_tokens)
        return len(overlap) / len(question_tokens)

    def _compute_category_name_score(self, question: str, category: str) -> float:
        category_label = category.replace("_", " ")
        return self._compute_lexical_overlap_score(question, category_label)

    def _score_chunks_by_vector(
        self,
        chunks: list[dict],
        *,
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        ranked = []
        for chunk in chunks:
            vector_score = float(chunk.get("score", 0.0))
            legal_modifier = self.legal_ranking_service.score_legal_relevance(
                chunk, question_profile, query_mode
            )
            ranked.append({
                **chunk,
                "vector_score": vector_score,
                "rrf_score": 0.0,
                "legal_modifier": legal_modifier,
                "final_score": vector_score + legal_modifier,
            })
        ranked.sort(key=lambda c: c["final_score"], reverse=True)
        return ranked

    def _rrf_rerank(
        self,
        *,
        enriched_map: dict[tuple[str, int], dict],
        dense_ranks: dict[tuple[str, int], int],
        bm25_ranks: dict[tuple[str, int], int],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        K = settings.rrf_k_constant
        n_dense = len(dense_ranks)
        n_bm25 = len(bm25_ranks)
        ranked = []

        for key, chunk in enriched_map.items():
            d_rank = dense_ranks.get(key, n_dense + K)
            b_rank = bm25_ranks.get(key, n_bm25 + K)
            rrf_score = 1 / (K + d_rank) + 1 / (K + b_rank)

            legal_modifier = self.legal_ranking_service.score_legal_relevance(
                chunk, question_profile, query_mode
            )
            # Scale the modifier so it is proportional to the RRF score range
            # (~0.016–0.033).  Without scaling, legal_modifier (±0.30) would
            # be 4–18× larger than the RRF signal, making content rank irrelevant.
            scaled_modifier = legal_modifier * settings.rrf_legal_modifier_scale
            ranked.append({
                **chunk,
                "vector_score": float(chunk.get("score", 0.0)),
                "rrf_score": rrf_score,
                "legal_modifier": legal_modifier,
                "final_score": rrf_score + scaled_modifier,
            })

        ranked.sort(key=lambda x: x["final_score"], reverse=True)
        return ranked

    def _probe_categories(
        self,
        question: str,
        query_vector: list[float],
        categories: list[str],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        enrich_fn,
    ) -> list[dict]:
        category_candidates = []

        for category in categories:
            probe_chunks = self.qdrant_repository.search(
                category=category,
                query_vector=query_vector,
                limit=settings.category_probe_top_k,
                query_mode=query_mode,
            )
            if not probe_chunks:
                continue

            enriched_probe_chunks = enrich_fn(probe_chunks)
            scored_probe_chunks = self._score_chunks_by_vector(
                enriched_probe_chunks,
                question_profile=question_profile,
                query_mode=query_mode,
            )
            best_probe_chunk = scored_probe_chunks[0]
            category_name_score = self._compute_category_name_score(question, category)
            category_score = (
                settings.category_content_weight * best_probe_chunk["final_score"]
            ) + (
                settings.category_name_weight * category_name_score
            )

            category_candidates.append(
                {
                    "category": category,
                    "category_score": category_score,
                    "probe_chunk": best_probe_chunk,
                }
            )

        category_candidates.sort(
            key=lambda item: item["category_score"],
            reverse=True,
        )
        return category_candidates

    def _detect_best_category(
        self,
        question: str,
        query_vector: list[float],
        categories: list[str],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        enrich_fn,
    ) -> str | None:
        category_candidates = self._probe_categories(
            question=question,
            query_vector=query_vector,
            categories=categories,
            question_profile=question_profile,
            query_mode=query_mode,
            enrich_fn=enrich_fn,
        )
        if not category_candidates:
            return None

        best_candidate = category_candidates[0]
        if best_candidate["category_score"] >= settings.min_final_score:
            return best_candidate["category"]

        if best_candidate["probe_chunk"]["final_score"] >= settings.min_final_score:
            return best_candidate["category"]

        return None

    def _collect_related_document_targets(self, chunk: dict) -> list[tuple[str, str]]:
        targets: list[tuple[str, str]] = []
        category = str(chunk.get("category", "")).strip()
        related_document_id = str(chunk.get("related_document_id", "")).strip()
        if category and related_document_id:
            targets.append((category, related_document_id))

        document_id = str(chunk.get("document_id", "")).strip()
        if document_id:
            for source_document in self.document_repository.find_documents_pointing_to(document_id):
                if source_document.id:
                    targets.append((source_document.category, source_document.id))

        deduped: list[tuple[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for target in targets:
            if target in seen:
                continue
            seen.add(target)
            deduped.append(target)
        return deduped

    def _should_run_related_retrieval(
        self,
        *,
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        main_ranked_chunks: list[dict],
    ) -> bool:
        if query_mode != "comparison" and question_profile not in {"historical", "comparative"}:
            return False

        return any(self._collect_related_document_targets(chunk) for chunk in main_ranked_chunks[:3])

    def _retrieve_related_ranked_chunks(
        self,
        *,
        question: str,
        query_vector: list[float],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        main_ranked_chunks: list[dict],
        enrich_fn,
        dedupe_fn,
    ) -> list[dict]:
        related_ranked_chunks: list[dict] = []
        seen_related_pairs: set[tuple[str, str]] = set()

        for chunk in main_ranked_chunks[:3]:
            for category, related_document_id in self._collect_related_document_targets(chunk):
                pair = (category, related_document_id)
                if pair in seen_related_pairs:
                    continue
                seen_related_pairs.add(pair)

                related_chunks = self.qdrant_repository.search_within_document(
                    category=category,
                    document_id=related_document_id,
                    query_vector=query_vector,
                    limit=settings.related_doc_chunks_limit,
                    query_mode=query_mode,
                )
                if not related_chunks:
                    continue

                enriched_related_chunks = enrich_fn(related_chunks)
                scored_related_chunks = self._score_chunks_by_vector(
                    enriched_related_chunks,
                    question_profile=question_profile,
                    query_mode=query_mode,
                )
                related_ranked_chunks.extend(scored_related_chunks)

        related_ranked_chunks.sort(key=lambda item: item["final_score"], reverse=True)
        return dedupe_fn(related_ranked_chunks)

    def retrieve(
        self,
        *,
        normalized_question: str,
        query_vector: list[float],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        enrich_fn,
        dedupe_fn,
        filter_relevant_chunks_fn,
        filter_relevant_chunks_rrf_fn,
        filter_relevant_chunks_vector_fn,
    ) -> dict:
        """
        Orchestrates category detection, dense+BM25 retrieval, RRF fusion,
        and related-document retrieval. Returns a dict with:
          best_category, dense_chunks, ranked_main_chunks, relevant_main_chunks,
          related_ranked_chunks, related_relevant_chunks
        """
        available_categories = self.qdrant_repository.get_all_collections()
        if not available_categories:
            return {"no_collections": True}

        best_category = self._detect_best_category(
            question=normalized_question,
            query_vector=query_vector,
            categories=available_categories,
            question_profile=question_profile,
            query_mode=query_mode,
            enrich_fn=enrich_fn,
        )
        if best_category is None:
            return {"no_category": True}

        dense_chunks = self.qdrant_repository.search(
            category=best_category,
            query_vector=query_vector,
            limit=settings.rrf_retrieval_top_k,
            query_mode=query_mode,
        )
        if not dense_chunks:
            return {"no_dense_chunks": True, "best_category": best_category}

        all_category_chunks = self.qdrant_repository.get_all_chunks(best_category, query_mode)
        bm25_results = self.bm25_service_class(
            all_category_chunks,
            nlp_provider=self.nlp_service.provider,
        ).search(normalized_question, top_k=settings.rrf_retrieval_top_k)

        chunk_registry: dict[tuple[str, int], dict] = {}
        for chunk in dense_chunks:
            key = (str(chunk["document_id"]), int(chunk["chunk_index"]))
            chunk_registry[key] = chunk
        for chunk in bm25_results:
            key = (str(chunk["document_id"]), int(chunk["chunk_index"]))
            if key not in chunk_registry:
                chunk_registry[key] = chunk

        enriched_all = enrich_fn(list(chunk_registry.values()))
        enriched_map = {
            (str(c["document_id"]), int(c["chunk_index"])): c
            for c in enriched_all
        }
        dense_ranks = {
            (str(c["document_id"]), int(c["chunk_index"])): i + 1
            for i, c in enumerate(dense_chunks)
        }
        bm25_ranks = {
            (str(c["document_id"]), int(c["chunk_index"])): i + 1
            for i, c in enumerate(bm25_results)
        }

        ranked_main_chunks = self._rrf_rerank(
            enriched_map=enriched_map,
            dense_ranks=dense_ranks,
            bm25_ranks=bm25_ranks,
            question_profile=question_profile,
            query_mode=query_mode,
        )
        relevant_main_chunks = filter_relevant_chunks_rrf_fn(ranked_main_chunks)

        related_ranked_chunks: list[dict] = []
        related_relevant_chunks: list[dict] = []
        if self._should_run_related_retrieval(
            question_profile=question_profile,
            query_mode=query_mode,
            main_ranked_chunks=ranked_main_chunks,
        ):
            related_ranked_chunks = self._retrieve_related_ranked_chunks(
                question=normalized_question,
                query_vector=query_vector,
                question_profile=question_profile,
                query_mode=query_mode,
                main_ranked_chunks=ranked_main_chunks,
                enrich_fn=enrich_fn,
                dedupe_fn=dedupe_fn,
            )
            # Related chunks are scored by vector-only (_score_chunks_by_vector),
            # so lexical_score is never set.  Use the vector-specific filter
            # instead of the hybrid one to avoid always returning an empty list.
            related_relevant_chunks = filter_relevant_chunks_vector_fn(related_ranked_chunks)

        return {
            "best_category": best_category,
            "dense_chunks": dense_chunks,
            "ranked_main_chunks": ranked_main_chunks,
            "relevant_main_chunks": relevant_main_chunks,
            "related_ranked_chunks": related_ranked_chunks,
            "related_relevant_chunks": related_relevant_chunks,
        }
