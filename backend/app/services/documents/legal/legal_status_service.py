from datetime import UTC, date, datetime

from app.models.document_model import DocumentModel
from app.repositories.document_repository import DocumentRepository
from app.schemas import LegalRelationType, LegalStatus


class LegalStatusService:
    EFFECTIVE_RELATIONS = {
        LegalRelationType.remplace.value: LegalStatus.remplace.value,
        LegalRelationType.abroge.value: LegalStatus.abroge.value,
    }

    def __init__(self, document_repository: DocumentRepository | None = None) -> None:
        self.document_repository = document_repository or DocumentRepository()

    def resolve_status(self, document: DocumentModel) -> str:
        if document.deleted_at is not None and document.legal_status == LegalStatus.abroge.value:
            return LegalStatus.abroge.value

        if self.is_scheduled(document):
            return LegalStatus.futur.value

        relation_sources = self._collect_effective_relation_sources(document)
        if not relation_sources:
            return LegalStatus.actif.value

        relation_sources.sort(
            key=lambda item: (
                self._relation_sort_date(item),
                1 if item.relation_to_target == LegalRelationType.abroge.value else 0,
            ),
            reverse=True,
        )
        return self.EFFECTIVE_RELATIONS.get(
            relation_sources[0].relation_to_target,
            LegalStatus.actif.value,
        )

    def infer_status_from_date(self, date_entree_vigueur: object) -> str:
        if self._is_future_date(date_entree_vigueur):
            return LegalStatus.futur.value
        return LegalStatus.actif.value

    def is_scheduled(self, document: DocumentModel) -> bool:
        return self._is_future_date(document.date_entree_vigueur)

    def source_may_supersede_target(
        self,
        source_document: DocumentModel,
        target_document: DocumentModel,
    ) -> bool:
        return self._source_may_supersede_target_internal(source_document, target_document)

    def _collect_effective_relation_sources(self, document: DocumentModel) -> list[DocumentModel]:
        relation_sources: list[DocumentModel] = []
        seen_ids: set[str] = set()

        if document.id:
            for source in self.document_repository.find_documents_pointing_to(document.id):
                if self._source_may_supersede_target_internal(source, document):
                    relation_sources.append(source)
                    if source.id:
                        seen_ids.add(source.id)

        direct_source = self._resolve_direct_relation_source(document)
        if direct_source is not None and (direct_source.id or "") not in seen_ids:
            relation_sources.append(direct_source)

        return relation_sources

    def _resolve_direct_relation_source(self, document: DocumentModel) -> DocumentModel | None:
        if document.relation_to_target not in self.EFFECTIVE_RELATIONS or not document.target_document_id:
            return None

        related_document = self.document_repository.get_by_id(document.target_document_id)
        if related_document is None or related_document.deleted_at is not None:
            return None

        if not self._source_may_supersede_target_internal(related_document, document):
            return None

        return related_document

    def _source_may_supersede_target_internal(
        self,
        source_document: DocumentModel,
        target_document: DocumentModel,
    ) -> bool:
        if source_document.id and source_document.id == target_document.id:
            return False
        if source_document.relation_to_target not in self.EFFECTIVE_RELATIONS:
            return False
        if self.is_scheduled(source_document):
            return False
        if not self._source_is_not_older_than_target(source_document, target_document):
            return False
        return True

    def _source_is_not_older_than_target(
        self,
        source_document: DocumentModel,
        target_document: DocumentModel,
    ) -> bool:
        source_date = self._relation_sort_date(source_document)
        target_date = self._relation_sort_date(target_document)
        return source_date >= target_date

    def _relation_sort_date(self, document: DocumentModel) -> date:
        value = (
            document.date_entree_vigueur
            or document.date_publication
            or document.issued_at
            or document.created_at
        )
        return self._to_date(value) or date.min

    def _is_future_date(self, value: object) -> bool:
        value_date = self._to_date(value)
        if value_date is None:
            return False
        return value_date > datetime.now(UTC).date()

    @staticmethod
    def _to_date(value: object) -> date | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
            except ValueError:
                return None
        return None
