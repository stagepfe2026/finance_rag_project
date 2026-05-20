from app.repositories.document_repository import DocumentRepository
from app.services.documents.legal.legal_status_service import LegalStatusService
from app.services.rag.generation.prompt_builder_service import PromptBuilderService


class DocumentContextService:
    def __init__(
        self,
        document_repository: DocumentRepository,
        legal_status_service: LegalStatusService,
        prompt_builder_service: PromptBuilderService,
    ):
        self.document_repository = document_repository
        self.legal_status_service = legal_status_service
        self.prompt_builder_service = prompt_builder_service

    def _enrich_chunks_with_document_metadata(self, retrieved_chunks: list[dict]) -> list[dict]:
        document_ids = [str(chunk.get("document_id", "")).strip() for chunk in retrieved_chunks]
        documents = {
            document.id or "": document
            for document in self.document_repository.get_many_by_ids(document_ids)
            if (document.id or "").strip()
        }

        enriched_chunks: list[dict] = []
        for chunk in retrieved_chunks:
            document = documents.get(str(chunk.get("document_id", "")).strip())
            if document is None:
                enriched_chunks.append(
                    {
                        **chunk,
                        "legal_status": self.legal_status_service.infer_status_from_date(
                            chunk.get("date_entree_vigueur")
                        ),
                        "document_type_label": chunk.get("document_type", "autre"),
                    }
                )
                continue

            related_document = (
                documents.get(document.target_document_id or "")
                if document.target_document_id
                else None
            )
            if related_document is None and document.target_document_id:
                related_document = self.document_repository.get_by_id(document.target_document_id)

            effective_legal_status = self.legal_status_service.resolve_status(document)
            enriched_chunks.append(
                {
                    **chunk,
                    "document_title": document.title,
                    "document_type": document.legal_type,
                    "document_type_label": document.legal_type,
                    "legal_status": effective_legal_status,
                    "date_publication": document.date_publication,
                    "date_entree_vigueur": document.date_entree_vigueur,
                    "version": document.version,
                    "relation_type": document.relation_to_target,
                    "related_document_id": document.target_document_id,
                    "related_document_title": (
                        related_document.title if related_document is not None else chunk.get("related_document_title", "")
                    ),
                    "realized_at": document.issued_at,
                }
            )

        return enriched_chunks

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
                "rrf_score": float(chunk.get("rrf_score", 0.0)),
                "reranker_score": float(chunk.get("reranker_score", 0.0)),
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
