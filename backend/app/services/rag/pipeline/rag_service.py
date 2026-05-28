import logging
import re
from typing import Literal

from app.core.config import settings
from app.core.rag_messages import MSG_NO_SYSTEM, MSG_OUT_OF_DOMAIN, MSG_UNRELIABLE
from app.infrastructure.nlp.nlp_provider import FrenchNlpProvider
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.services.documents.legal.legal_status_service import LegalStatusService
from app.services.rag.generation.generation_service import GenerationService
from app.services.rag.generation.prompt_builder_service import PromptBuilderService
from app.services.rag.pipeline.document_context_service import DocumentContextService
from app.services.rag.pipeline.retrieval_filter_service import RetrievalFilterService
from app.services.rag.pipeline.retrieval_service import RetrievalService
from app.services.rag.processing.embedding_service import EmbeddingService
from app.services.rag.processing.nlp_service import NLPService
from app.services.rag.ranking.bm25_service import BM25Service
from app.services.rag.ranking.legal_ranking_service import LegalRankingService
from app.services.rag.ranking.reranker_service import RerankerService

_SOURCE_TAG_RE = re.compile(r"[\s,]*\[Source\s*\d+\][\s,]*")


class RagService:
    def __init__(
        self,
        embedding_service: EmbeddingService,
        generation_service: GenerationService,
    ):
        self.embedding_service = embedding_service
        self.generation_service = generation_service

        qdrant_repository = QdrantRepository()
        document_repository = DocumentRepository()
        nlp_service = NLPService(FrenchNlpProvider())
        legal_ranking_service = LegalRankingService()
        legal_status_service = LegalStatusService(document_repository)
        prompt_builder_service = PromptBuilderService()

        self.nlp_service = nlp_service
        self.legal_ranking_service = legal_ranking_service
        self.prompt_builder_service = prompt_builder_service
        self.reranker_service = RerankerService()

        self.retrieval_service = RetrievalService(
            qdrant_repository=qdrant_repository,
            document_repository=document_repository,
            nlp_service=nlp_service,
            embedding_service=embedding_service,
            bm25_service=BM25Service,
            legal_ranking_service=legal_ranking_service,
        )
        self.document_context_service = DocumentContextService(
            document_repository=document_repository,
            legal_status_service=legal_status_service,
            prompt_builder_service=prompt_builder_service,
        )
        self.retrieval_filter_service = RetrievalFilterService(
            nlp_service=nlp_service,
        )

        self.logger = logging.getLogger(__name__)

    def answer(
        self,
        question: str,
        response_mode: Literal["short", "detailed"] = "detailed",
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> dict:
        normalized_question = self.nlp_service.preprocess_query(question)
        query_vector = self.embedding_service.generate_embeddings([normalized_question])[0]
        question_profile = self.legal_ranking_service.classify_question(normalized_question)

        # Step 1: Retrieval — get candidate chunks
        retrieval_result = self.retrieval_service.retrieve(
            normalized_question=normalized_question,
            query_vector=query_vector,
            question_profile=question_profile,
            query_mode=query_mode,
            enrich_fn=self.document_context_service._enrich_chunks_with_document_metadata,
            dedupe_fn=self.retrieval_filter_service._dedupe_chunks,
            filter_relevant_chunks_fn=self.retrieval_filter_service._filter_relevant_chunks,
            filter_relevant_chunks_rrf_fn=self.retrieval_filter_service._filter_relevant_chunks_rrf,
            filter_relevant_chunks_vector_fn=self.retrieval_filter_service._filter_relevant_chunks_vector,
        )

        if retrieval_result.get("no_collections"):
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [],
                "answer": MSG_NO_SYSTEM,
                "sources": [],
            }

        if retrieval_result.get("no_category"):
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [],
                "answer": MSG_OUT_OF_DOMAIN,
                "sources": [],
            }

        best_category = retrieval_result["best_category"]

        if retrieval_result.get("no_dense_chunks"):
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [best_category],
                "answer": MSG_OUT_OF_DOMAIN,
                "sources": [],
            }

        ranked_main_chunks = retrieval_result["ranked_main_chunks"]
        relevant_main_chunks = retrieval_result["relevant_main_chunks"]
        related_ranked_chunks = retrieval_result["related_ranked_chunks"]
        related_relevant_chunks = retrieval_result["related_relevant_chunks"]
        dense_chunks = retrieval_result["dense_chunks"]

        self.logger.info(
            "RAG retrieval question=%r profile=%s query_mode=%s category=%s main_retrieved=%d main_ranked=%d main_relevant=%d related_ranked=%d related_relevant=%d",
            normalized_question,
            question_profile,
            query_mode,
            best_category,
            len(dense_chunks),
            len(ranked_main_chunks),
            len(relevant_main_chunks),
            len(related_ranked_chunks),
            len(related_relevant_chunks),
        )

        if not relevant_main_chunks and not related_relevant_chunks:
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [best_category],
                "answer": MSG_UNRELIABLE,
                "sources": [],
            }

        # Step 3: Filter — select the final chunk set
        final_chunks = self.retrieval_filter_service._build_final_chunks(
            main_relevant_chunks=relevant_main_chunks,
            related_relevant_chunks=related_relevant_chunks,
            related_ranked_chunks=related_ranked_chunks,
            question_profile=question_profile,
            query_mode=query_mode,
        )

        # Expand the reranker candidate pool so the cross-encoder can rescue
        # relevant chunks that were ranked lower by RRF/scoring.
        # Pool = final_top_k × reranker_pool_multiplier (default: 4 × 3 = 12).
        pool_size = settings.final_top_k * settings.reranker_pool_multiplier
        if len(final_chunks) < pool_size:
            all_candidates = self.retrieval_filter_service._dedupe_chunks(
                relevant_main_chunks + related_relevant_chunks
            )
            existing_keys = {
                (str(c.get("document_id", "")).strip(), int(c.get("chunk_index", -1)))
                for c in final_chunks
            }
            for chunk in all_candidates:
                key = (str(chunk.get("document_id", "")).strip(), int(chunk.get("chunk_index", -1)))
                if key in existing_keys:
                    continue
                final_chunks.append(chunk)
                existing_keys.add(key)
                if len(final_chunks) >= pool_size:
                    break

        reranked_pool = self.reranker_service.rerank(
            normalized_question, final_chunks, top_k=len(final_chunks)
        )

        # Keep only chunks with acceptable confidence; fall back to top-k if none pass.
        confident_chunks = [
            c for c in reranked_pool
            if c.get("reranker_score", 0.0) >= settings.min_reranker_score
        ]
        final_chunks = (confident_chunks or reranked_pool)[: settings.final_top_k]

        best_reranker_score = max((c.get("reranker_score", 0.0) for c in final_chunks), default=0.0)
        if best_reranker_score >= settings.confidence_high_threshold:
            confidence_level = "high"
        elif best_reranker_score >= settings.confidence_medium_threshold:
            confidence_level = "medium"
        else:
            confidence_level = "low"
        self.logger.info(
            "RAG final_chunks question=%r total=%d documents=%s",
            normalized_question,
            len(final_chunks),
            [
                {
                    "document_id": str(chunk.get("document_id", "")).strip(),
                    "chunk_index": int(chunk.get("chunk_index", -1)),
                    "final_score": float(chunk.get("final_score", 0.0)),
                }
                for chunk in final_chunks
            ],
        )

        # Step 4: Build prompt
        context = self.prompt_builder_service.format_context(final_chunks)
        prompt = self.prompt_builder_service.compose_prompt(
            question=normalized_question,
            context=context,
            response_mode=response_mode,
            question_profile=question_profile,
            query_mode=query_mode,
        )

        # Step 5: Generate answer
        answer = self.generation_service.generate_answer(
            prompt=prompt,
            temperature=settings.temperature,
            top_k=settings.top_k,
            top_p=settings.top_p,
            max_new_tokens=settings.max_new_tokens,
            repetition_penalty=settings.repetition_penalty,
            context_window=settings.context_window,
        )
        self.logger.info(
            "RAG generation raw_answer=%r best_scores={vector=%.4f rrf=%.4f reranker=%.4f final=%.4f}",
            answer,
            max(chunk.get("vector_score", 0.0) for chunk in final_chunks),
            max(chunk.get("rrf_score", 0.0) for chunk in final_chunks),
            max(chunk.get("reranker_score", 0.0) for chunk in final_chunks),
            max(chunk.get("final_score", 0.0) for chunk in final_chunks),
        )

        answer = self._strip_source_tags(answer)

        if self.retrieval_filter_service._needs_fallback(answer, final_chunks):
            self.logger.warning(
                "RAG fallback triggered for question=%r raw_answer=%r",
                normalized_question,
                answer,
            )
            answer = MSG_UNRELIABLE
        else:
            answer = self.document_context_service._ensure_future_warnings(answer, final_chunks)

        return {
            "question": normalized_question,
            "query_mode": query_mode,
            "detected_categories": [best_category],
            "question_profile": question_profile,
            "confidence_level": confidence_level,
            "answer": answer,
            "sources": self.document_context_service._build_document_sources(final_chunks),
        }

    @staticmethod
    def _strip_source_tags(answer: str) -> str:
        cleaned = _SOURCE_TAG_RE.sub(" ", answer)
        return re.sub(r" {2,}", " ", cleaned).strip()
