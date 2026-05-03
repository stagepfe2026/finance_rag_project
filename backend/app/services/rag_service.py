import logging
from typing import Literal

from app.core.config import settings
from app.infrastructure.nlp.nlp_provider import NLPProvider
from app.repositories.document_repository import DocumentRepository
from app.repositories.qdrant_repository import QdrantRepository
from app.services.embedding_service import EmbeddingService
from app.services.generation_service import GenerationService
from app.services.legal_ranking_service import LegalRankingService
from app.services.legal_status_service import LegalStatusService
from app.services.nlp_service import NLPService
from app.services.prompt_builder_service import PromptBuilderService


class RagService:
    def __init__(
        self,
        embedding_service: EmbeddingService,
        generation_service: GenerationService,
    ):
        self.embedding_service = embedding_service
        self.generation_service = generation_service
        self.qdrant_repository = QdrantRepository()
        self.document_repository = DocumentRepository()
        self.nlp_service = NLPService(NLPProvider())
        self.legal_ranking_service = LegalRankingService()
        self.legal_status_service = LegalStatusService(self.document_repository)
        self.prompt_builder_service = PromptBuilderService()
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

    def _enrich_chunks_with_document_metadata(self, retrieved_chunks: list[dict]) -> list[dict]:
        document_ids = [str(chunk.get("document_id", "")).strip() for chunk in retrieved_chunks]
        documents = {
            document.id or "": document
            for document in self.document_repository.get_by_ids(document_ids)
            if (document.id or "").strip()
        }

        enriched_chunks: list[dict] = []
        for chunk in retrieved_chunks:
            document = documents.get(str(chunk.get("document_id", "")).strip())
            if document is None:
                enriched_chunks.append(
                    {
                        **chunk,
                        "legal_status": self.legal_status_service.compute_status_from_effective_date(
                            chunk.get("date_entree_vigueur")
                        ),
                        "document_type_label": chunk.get("document_type", "autre"),
                    }
                )
                continue

            related_document = (
                documents.get(document.related_document_id or "")
                if document.related_document_id
                else None
            )
            if related_document is None and document.related_document_id:
                related_document = self.document_repository.get_by_id(document.related_document_id)

            effective_legal_status = self.legal_status_service.compute_effective_legal_status(document)
            enriched_chunks.append(
                {
                    **chunk,
                    "document_title": document.title,
                    "document_type": document.document_type,
                    "document_type_label": document.document_type,
                    "legal_status": effective_legal_status,
                    "date_publication": document.date_publication,
                    "date_entree_vigueur": document.date_entree_vigueur,
                    "version": document.version,
                    "relation_type": document.relation_type,
                    "related_document_id": document.related_document_id,
                    "related_document_title": (
                        related_document.title if related_document is not None else chunk.get("related_document_title", "")
                    ),
                    "realized_at": document.realized_at,
                }
            )

        return enriched_chunks

    def _hybrid_rerank(
        self,
        question: str,
        retrieved_chunks: list[dict],
        *,
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        ranked = []

        for chunk in retrieved_chunks:
            vector_score = float(chunk["score"])
            lexical_score = self._compute_lexical_overlap_score(question, chunk["text"])
            legal_modifier = self.legal_ranking_service.compute_legal_modifier(
                chunk,
                question_profile,
                query_mode,
            )
            final_score = (0.68 * vector_score) + (0.22 * lexical_score) + legal_modifier

            enriched_chunk = {
                **chunk,
                "vector_score": vector_score,
                "lexical_score": lexical_score,
                "legal_modifier": legal_modifier,
                "final_score": final_score,
            }
            ranked.append(enriched_chunk)

        ranked.sort(key=lambda item: item["final_score"], reverse=True)
        return ranked

    def _filter_relevant_chunks(self, ranked_chunks: list[dict]) -> list[dict]:
        return [
            chunk
            for chunk in ranked_chunks
            if chunk["vector_score"] >= settings.min_vector_score
            and chunk["lexical_score"] >= settings.min_lexical_score
            and chunk["final_score"] >= settings.min_final_score
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

    def _collect_related_document_targets(self, chunk: dict) -> list[tuple[str, str]]:
        targets: list[tuple[str, str]] = []
        category = str(chunk.get("category", "")).strip()
        related_document_id = str(chunk.get("related_document_id", "")).strip()
        if category and related_document_id:
            targets.append((category, related_document_id))

        document_id = str(chunk.get("document_id", "")).strip()
        if document_id:
            for source_document in self.document_repository.find_relation_sources_for_target(document_id):
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

    def _retrieve_related_ranked_chunks(
        self,
        *,
        question: str,
        query_vector: list[float],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
        main_ranked_chunks: list[dict],
    ) -> list[dict]:
        related_ranked_chunks: list[dict] = []
        seen_related_pairs: set[tuple[str, str]] = set()

        for chunk in main_ranked_chunks[:3]:
            for category, related_document_id in self._collect_related_document_targets(chunk):
                pair = (category, related_document_id)
                if pair in seen_related_pairs:
                    continue
                seen_related_pairs.add(pair)

                related_chunks = self.qdrant_repository.search_chunks_for_document(
                    category=category,
                    document_id=related_document_id,
                    query_vector=query_vector,
                    limit=2,
                    query_mode=query_mode,
                )
                if not related_chunks:
                    continue

                enriched_related_chunks = self._enrich_chunks_with_document_metadata(related_chunks)
                ranked_related_chunks = self._hybrid_rerank(
                    question,
                    enriched_related_chunks,
                    question_profile=question_profile,
                    query_mode=query_mode,
                )
                related_ranked_chunks.extend(ranked_related_chunks)

        related_ranked_chunks.sort(key=lambda item: item["final_score"], reverse=True)
        return self._dedupe_chunks(related_ranked_chunks)

    def _build_final_chunks(
        self,
        *,
        main_relevant_chunks: list[dict],
        related_relevant_chunks: list[dict],
        related_ranked_chunks: list[dict],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
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

    def _probe_categories(
        self,
        question: str,
        query_vector: list[float],
        categories: list[str],
        question_profile: str,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> list[dict]:
        category_candidates = []

        for category in categories:
            probe_chunks = self.qdrant_repository.search_chunks(
                category=category,
                query_vector=query_vector,
                limit=settings.category_probe_top_k,
                query_mode=query_mode,
            )
            if not probe_chunks:
                continue

            enriched_probe_chunks = self._enrich_chunks_with_document_metadata(probe_chunks)
            ranked_probe_chunks = self._hybrid_rerank(
                question,
                enriched_probe_chunks,
                question_profile=question_profile,
                query_mode=query_mode,
            )
            best_probe_chunk = ranked_probe_chunks[0]
            category_name_score = self._compute_category_name_score(question, category)
            category_score = (0.85 * best_probe_chunk["final_score"]) + (0.15 * category_name_score)

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
    ) -> str | None:
        category_candidates = self._probe_categories(
            question=question,
            query_vector=query_vector,
            categories=categories,
            question_profile=question_profile,
            query_mode=query_mode,
        )
        if not category_candidates:
            return None

        best_candidate = category_candidates[0]
        if best_candidate["category_score"] >= settings.min_final_score:
            return best_candidate["category"]

        if best_candidate["probe_chunk"]["final_score"] >= settings.min_final_score:
            return best_candidate["category"]

        return None

    def _needs_fallback(self, answer: str, final_chunks: list[dict]) -> bool:
        cleaned_answer = answer.strip()
        if not cleaned_answer:
            return True

        lowered_answer = cleaned_answer.lower()
        if lowered_answer == "information non trouvee dans les sources fournies.":
            return False

        best_final_score = max(chunk["final_score"] for chunk in final_chunks)
        best_lexical_score = max(chunk["lexical_score"] for chunk in final_chunks)
        best_vector_score = max(chunk["vector_score"] for chunk in final_chunks)

        # With retrieved sources already selected, avoid aggressively discarding grounded answers.
        if best_final_score >= 0.56 or (best_vector_score >= 0.58 and best_lexical_score >= 0.16):
            return False

        context_text = " ".join(chunk["text"] for chunk in final_chunks).lower()
        answer_tokens = [
            token
            for token in self.nlp_service.provider.tokenize_words(lowered_answer)
            if len(token) > 5
        ]
        unsupported_tokens = [token for token in answer_tokens if token not in context_text]

        # Only reject clearly off-context answers. Short grounded answers should pass through.
        if len(cleaned_answer) <= 240:
            return False

        return len(unsupported_tokens) > 35

    def _build_document_sources(self, chunks: list[dict]) -> list[dict]:
        documents: dict[str, dict] = {}

        for chunk in chunks:
            document_id = str(chunk.get("document_id", "")).strip()
            document_name = str(chunk.get("document_name", "")).strip()
            dedupe_key = document_id or document_name
            if not dedupe_key:
                continue

            current = documents.get(dedupe_key)
            candidate = {
                "document_id": document_id,
                "category": str(chunk.get("category", "")).strip(),
                "document_name": document_name,
                "document_type": str(chunk.get("document_type", "")).strip(),
                "legal_status": str(chunk.get("legal_status", "actif")).strip(),
                "date_publication": chunk.get("date_publication"),
                "date_entree_vigueur": chunk.get("date_entree_vigueur"),
                "version": str(chunk.get("version", "")).strip(),
                "relation_type": str(chunk.get("relation_type", "none")).strip(),
                "related_document_id": str(chunk.get("related_document_id", "")).strip() or None,
                "related_document_title": str(chunk.get("related_document_title", "")).strip(),
                "chunk_index": int(chunk.get("chunk_index", -1)),
                "vector_score": float(chunk.get("vector_score", 0.0)),
                "lexical_score": float(chunk.get("lexical_score", 0.0)),
                "final_score": float(chunk.get("final_score", 0.0)),
            }

            if current is None or candidate["final_score"] > current["final_score"]:
                documents[dedupe_key] = candidate

        return sorted(documents.values(), key=lambda item: item["final_score"], reverse=True)

    def _ensure_future_warnings(self, answer: str, final_chunks: list[dict]) -> str:
        if "This legal document is not yet in force." in answer:
            return answer

        warnings: list[str] = []
        seen_dates: set[str] = set()
        for chunk in final_chunks:
            if str(chunk.get("legal_status", "")).strip() != "futur":
                continue
            effective_date = self.prompt_builder_service._format_value(
                chunk.get("date_entree_vigueur")
            )
            if effective_date in seen_dates:
                continue
            seen_dates.add(effective_date)
            warnings.append(
                "⚠️ This legal document is not yet in force. "
                f"It will be applicable from {effective_date}."
            )

        if not warnings:
            return answer

        return "\n".join([*warnings, answer]).strip()

    def ask(
        self,
        question: str,
        response_mode: Literal["short", "detailed"] = "detailed",
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> dict:
        normalized_question = self.nlp_service.preprocess_query(question)
        query_vector = self.embedding_service.generate_embeddings([normalized_question])[0]
        question_profile = self.legal_ranking_service.detect_question_profile(normalized_question)

        available_categories = self.qdrant_repository.get_all_collections()
        if not available_categories:
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [],
                "answer": "Aucune base de connaissance n'est disponible dans Qdrant.",
                "sources": [],
            }

        best_category = self._detect_best_category(
            question=normalized_question,
            query_vector=query_vector,
            categories=available_categories,
            question_profile=question_profile,
            query_mode=query_mode,
        )
        if best_category is None:
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [],
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        retrieved_chunks = self.qdrant_repository.search_chunks(
            category=best_category,
            query_vector=query_vector,
            limit=settings.retrieval_top_k_per_category,
            query_mode=query_mode,
        )
        if not retrieved_chunks:
            return {
                "question": normalized_question,
                "query_mode": query_mode,
                "detected_categories": [best_category],
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        enriched_main_chunks = self._enrich_chunks_with_document_metadata(retrieved_chunks)
        ranked_main_chunks = self._hybrid_rerank(
            normalized_question,
            enriched_main_chunks,
            question_profile=question_profile,
            query_mode=query_mode,
        )
        relevant_main_chunks = self._filter_relevant_chunks(ranked_main_chunks)

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
            )
            related_relevant_chunks = self._filter_relevant_chunks(related_ranked_chunks)

        self.logger.info(
            "RAG retrieval question=%r profile=%s query_mode=%s category=%s main_retrieved=%d main_ranked=%d main_relevant=%d related_ranked=%d related_relevant=%d",
            normalized_question,
            question_profile,
            query_mode,
            best_category,
            len(retrieved_chunks),
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
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        final_chunks = self._build_final_chunks(
            main_relevant_chunks=relevant_main_chunks,
            related_relevant_chunks=related_relevant_chunks,
            related_ranked_chunks=related_ranked_chunks,
            question_profile=question_profile,
            query_mode=query_mode,
        )
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
        context = self.prompt_builder_service.build_context(final_chunks)
        prompt = self.prompt_builder_service.build_prompt(
            question=normalized_question,
            context=context,
            response_mode=response_mode,
            question_profile=question_profile,
            query_mode=query_mode,
        )

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
            "RAG generation raw_answer=%r best_scores={vector=%.4f lexical=%.4f final=%.4f}",
            answer,
            max(chunk["vector_score"] for chunk in final_chunks),
            max(chunk["lexical_score"] for chunk in final_chunks),
            max(chunk["final_score"] for chunk in final_chunks),
        )

        if self._needs_fallback(answer, final_chunks):
            self.logger.warning(
                "RAG fallback triggered for question=%r raw_answer=%r",
                normalized_question,
                answer,
            )
            answer = "Information non trouvee dans les sources fournies."
        else:
            answer = self._ensure_future_warnings(answer, final_chunks)

        return {
            "question": normalized_question,
            "query_mode": query_mode,
            "detected_categories": [best_category],
            "question_profile": question_profile,
            "answer": answer,
            "sources": self._build_document_sources(final_chunks),
        }
