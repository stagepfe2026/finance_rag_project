import re

from app.core.config import settings
from app.repositories.qdrant_repository import QdrantRepository
from app.services.embedding_service import EmbeddingService
from app.services.generation_service import GenerationService


class RagService:
    def __init__(
        self,
        embedding_service: EmbeddingService,
        generation_service: GenerationService,
    ):
        self.embedding_service = embedding_service
        self.generation_service = generation_service
        self.qdrant_repository = QdrantRepository()

    def _tokenize(self, text: str) -> set[str]:
        tokens = re.findall(r"\w+", text.lower())
        return {token for token in tokens if len(token) > 2}

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

    def _hybrid_rerank(self, question: str, retrieved_chunks: list[dict]) -> list[dict]:
        ranked = []

        for chunk in retrieved_chunks:
            vector_score = float(chunk["score"])
            lexical_score = self._compute_lexical_overlap_score(question, chunk["text"])
            final_score = (0.7 * vector_score) + (0.3 * lexical_score)

            enriched_chunk = {
                **chunk,
                "vector_score": vector_score,
                "lexical_score": lexical_score,
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

    def _probe_categories(
        self,
        question: str,
        query_vector: list[float],
        categories: list[str],
    ) -> list[dict]:
        category_candidates = []

        for category in categories:
            probe_chunks = self.qdrant_repository.search_chunks(
                category=category,
                query_vector=query_vector,
                limit=settings.category_probe_top_k,
            )
            if not probe_chunks:
                continue

            ranked_probe_chunks = self._hybrid_rerank(question, probe_chunks)
            best_probe_chunk = ranked_probe_chunks[0]
            category_name_score = self._compute_category_name_score(question, category)
            category_score = (0.85 * best_probe_chunk["final_score"]) + (
                0.15 * category_name_score
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
    ) -> str | None:
        category_candidates = self._probe_categories(
            question=question,
            query_vector=query_vector,
            categories=categories,
        )
        if not category_candidates:
            return None

        best_candidate = category_candidates[0]
        if best_candidate["category_score"] < settings.min_final_score:
            return None

        return best_candidate["category"]

    def _build_context(self, chunks: list[dict]) -> str:
        context_parts = []

        for idx, chunk in enumerate(chunks, start=1):
            context_parts.append(
                f"[Document {idx}]\n"
                f"Categorie: {chunk['category']}\n"
                f"Source: {chunk['document_name']}\n"
                f"Type: {chunk['document_type']}\n"
                f"Chunk: {chunk['chunk_index']}\n"
                f"Contenu: {chunk['text']}\n"
            )

        return "\n".join(context_parts)

    def _build_prompt(self, question: str, context: str) -> str:
        return f"""
Tu es un assistant juridique specialise en recherche documentaire.
Tu dois repondre uniquement a partir du contexte fourni.
N'ajoute aucune information absente du contexte.
N'infere ni pays, ni date, ni loi, ni exemple,
ni explication generale si cela n'est pas ecrit dans le contexte.
Si l'information n'apparait pas clairement dans le contexte,
reponds exactement : Information non trouvee dans les sources fournies.
Si l'information est presente, reponds en francais en 3 phrases maximum.
Liste uniquement les cas ou conditions explicitement mentionnes dans le contexte.
Si des articles sont visibles dans le contexte, cite leurs numeros.
N'utilise pas de formulation repetitive.

Contexte:
{context}

Question:
{question}

Reponse:
""".strip()

    def _needs_fallback(self, answer: str, final_chunks: list[dict]) -> bool:
        cleaned_answer = answer.strip()
        if not cleaned_answer:
            return True

        lowered_answer = cleaned_answer.lower()
        if lowered_answer == "information non trouvee dans les sources fournies.":
            return False

        forbidden_markers = [
            "france",
            "2025",
            "revenu global net",
            "taux d'imposition",
        ]
        if any(marker in lowered_answer for marker in forbidden_markers):
            return True

        best_final_score = max(chunk["final_score"] for chunk in final_chunks)
        best_lexical_score = max(chunk["lexical_score"] for chunk in final_chunks)

        if best_final_score >= 0.75 and best_lexical_score >= 0.5:
            return False

        context_text = " ".join(chunk["text"] for chunk in final_chunks).lower()
        answer_tokens = [
            token for token in re.findall(r"\w+", lowered_answer) if len(token) > 5
        ]
        unsupported_tokens = [token for token in answer_tokens if token not in context_text]

        return len(unsupported_tokens) > 20

    def ask(self, question: str) -> dict:
        query_vector = self.embedding_service.generate_embeddings([question])[0]

        available_categories = self.qdrant_repository.get_all_collections()
        if not available_categories:
            return {
                "question": question,
                "detected_categories": [],
                "answer": "Aucune base de connaissance n'est disponible dans Qdrant.",
                "sources": [],
            }

        best_category = self._detect_best_category(
            question=question,
            query_vector=query_vector,
            categories=available_categories,
        )
        if best_category is None:
            return {
                "question": question,
                "detected_categories": [],
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        retrieved_chunks = self.qdrant_repository.search_chunks(
            category=best_category,
            query_vector=query_vector,
            limit=settings.retrieval_top_k_per_category,
        )
        if not retrieved_chunks:
            return {
                "question": question,
                "detected_categories": [best_category],
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        ranked_chunks = self._hybrid_rerank(question, retrieved_chunks)
        relevant_chunks = self._filter_relevant_chunks(ranked_chunks)
        if not relevant_chunks:
            return {
                "question": question,
                "detected_categories": [best_category],
                "answer": "Information non trouvee dans les sources fournies.",
                "sources": [],
            }

        final_chunks = relevant_chunks[: settings.final_top_k]
        context = self._build_context(final_chunks)
        prompt = self._build_prompt(question, context)

        answer = self.generation_service.generate_answer(
            prompt=prompt,
            temperature=settings.temperature,
            top_k=settings.top_k,
            top_p=settings.top_p,
            max_new_tokens=settings.max_new_tokens,
            repetition_penalty=settings.repetition_penalty,
            context_window=settings.context_window,
        )

        if self._needs_fallback(answer, final_chunks):
            answer = "Information non trouvee dans les sources fournies."

        return {
            "question": question,
            "detected_categories": [best_category],
            "answer": answer,
            "sources": [
                {
                    "category": chunk["category"],
                    "document_name": chunk["document_name"],
                    "document_type": chunk["document_type"],
                    "chunk_index": chunk["chunk_index"],
                    "vector_score": chunk["vector_score"],
                    "lexical_score": chunk["lexical_score"],
                    "final_score": chunk["final_score"],
                }
                for chunk in final_chunks
            ],
        }
