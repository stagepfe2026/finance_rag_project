import re
from datetime import date

from app.models.document_model import DocumentModel
from app.repositories.document_favorite_repository import DocumentFavoriteRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas import DocumentActionResponse, DocumentListResponse, DocumentSearchResponse
from app.services.documents.legal.legal_status_service import LegalStatusService
from fastapi import HTTPException


class DocumentSearchService:
    def __init__(
        self,
        document_repository: DocumentRepository,
        legal_status_service: LegalStatusService,
        favorite_repository: DocumentFavoriteRepository | None = None,
    ) -> None:
        self.document_repository = document_repository
        self.legal_status_service = legal_status_service
        self.favorite_repository = favorite_repository or DocumentFavoriteRepository()

    def search_documents(
        self,
        *,
        query: str | None = None,
        title: str | None = None,
        categories: list[str] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        favorites_only: bool = False,
        current_user_id: str | None = None,
        sort_by: str = "recent",
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentSearchResponse:
        favorite_document_ids = self._resolve_favorite_ids(favorites_only, current_user_id)
        documents = self.document_repository.search(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorite_document_ids=favorite_document_ids,
            sort_by=sort_by,
            skip=skip,
            limit=limit,
        )
        total = self.document_repository.count_search_results(
            query=query,
            title=title,
            categories=categories,
            date_from=date_from,
            date_to=date_to,
            favorite_document_ids=favorite_document_ids,
        )
        favorited_ids = self._get_favorited_ids_set(current_user_id)
        return DocumentSearchResponse(
            items=[
                self._to_search_item(document, query=query, favorited_ids=favorited_ids)
                for document in documents
            ],
            total=total,
        )

    def list_documents(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        current_user_id: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> DocumentListResponse:
        documents = self.document_repository.list_all(
            search=search,
            category=category,
            status=status,
            skip=skip,
            limit=limit,
        )
        total = self.document_repository.count_all(
            search=search,
            category=category,
            status=status,
        )
        favorited_ids = self._get_favorited_ids_set(current_user_id)
        return DocumentListResponse(
            items=[
                self._with_effective_legal_status(document).to_out_schema(
                    is_favored=bool(document.id and document.id in favorited_ids)
                )
                for document in documents
            ],
            total=total,
        )

    def set_document_favorite(
        self,
        document_id: str,
        is_favorite: bool,
        *,
        current_user_id: str,
    ) -> DocumentActionResponse:
        if not current_user_id.strip():
            raise HTTPException(status_code=401, detail="Authentification requise.")

        document = self.document_repository.get_by_id(document_id)
        if document is None or document.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Document introuvable.")

        if is_favorite:
            self.favorite_repository.add(document_id, current_user_id)
        else:
            self.favorite_repository.remove(document_id, current_user_id)

        now_favored = self.favorite_repository.exists(document_id, current_user_id)
        return DocumentActionResponse(
            message="Favori mis a jour avec succes.",
            data=self._with_effective_legal_status(document).to_out_schema(is_favored=now_favored),
        )

    def _with_effective_legal_status(self, document: DocumentModel) -> DocumentModel:
        document.legal_status = self.legal_status_service.resolve_status(document)
        return document

    def _resolve_favorite_ids(
        self, favorites_only: bool, current_user_id: str | None
    ) -> list[str] | None:
        if not favorites_only:
            return None
        if not current_user_id:
            return []
        return self.favorite_repository.get_document_ids_for_user(current_user_id)

    def _get_favorited_ids_set(self, current_user_id: str | None) -> set[str]:
        if not current_user_id:
            return set()
        return set(self.favorite_repository.get_document_ids_for_user(current_user_id))

    def _to_search_item(
        self,
        document: DocumentModel,
        *,
        query: str | None,
        favorited_ids: set[str],
    ):
        effective_document = self._with_effective_legal_status(document)
        return effective_document.to_search_item_schema(
            snippets=self._build_snippets(effective_document, query=query),
            is_favored=bool(document.id and document.id in favorited_ids),
        )

    def _build_snippets(self, document: DocumentModel, *, query: str | None) -> list[str]:
        source = (document.extracted_text or "").strip()
        if not source:
            return []

        sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", source) if item.strip()]
        if not sentences:
            return [source[:220].strip()]

        query_terms = [term for term in re.split(r"\s+", (query or "").strip().lower()) if len(term) >= 2]
        matches: list[str] = []

        if query_terms:
            for sentence in sentences:
                lowered = sentence.lower()
                if any(term in lowered for term in query_terms):
                    matches.append(sentence)
                if len(matches) == 3:
                    break

        if matches:
            return matches

        return sentences[:2]
