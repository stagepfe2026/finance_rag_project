import hashlib
import logging
import re
from datetime import UTC, date, datetime
from typing import Literal

from app.core.config import settings
from qdrant_client import QdrantClient
from qdrant_client.models import (
    DatetimeRange,
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

# Motif article duplique ici pour eviter un import circulaire avec la couche NLP.
_ARTICLE_RE = re.compile(
    r"(?:Article|Art\.?)\s+"
    r"(?:Premier|1er|\d+(?:bis|ter|quater|quinquies)?)"
    r"(?:\s*[-:–—\.])?",
    re.IGNORECASE,
)


class QdrantRepository:
    def __init__(self):
        self.client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)
        self.logger = logging.getLogger(__name__)

    def _to_collection_name(self, category: str) -> str:
        return category.lower().replace(" ", "_")

    def ensure_collection(self, collection_name: str, vector_size: int):
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]

        if collection_name in existing:
            return

        self.client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
        self._create_payload_indexes(collection_name)

    def _create_payload_indexes(self, collection_name: str) -> None:
        """Create payload indexes for fields used in filters or score boosting.

        Without indexes, every filter triggers a full collection scan.
        Index creation is best-effort: errors are logged but not re-raised
        because the indexes are an optimisation, not a correctness requirement.
        """
        field_schemas: list[tuple[str, object]] = [
            ("document_id", PayloadSchemaType.KEYWORD),
            ("legal_status", PayloadSchemaType.KEYWORD),
            ("category", PayloadSchemaType.KEYWORD),
            ("article_number", PayloadSchemaType.KEYWORD),
            ("chunk_index", PayloadSchemaType.INTEGER),
            ("date_entree_vigueur", PayloadSchemaType.DATETIME),
        ]
        for field_name, schema_type in field_schemas:
            try:
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field_name,
                    field_schema=schema_type,
                )
            except Exception:
                self.logger.debug(
                    "Payload index for %s.%s skipped (may already exist).",
                    collection_name,
                    field_name,
                )

    def collection_exists(self, collection_name: str) -> bool:
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]
        return collection_name in existing

    def save_chunks(
        self,
        category: str,
        document_id: str,
        document_title: str,
        document_name: str,
        legal_type: str,
        legal_status: str,
        date_publication: str | None,
        date_entree_vigueur: str | None,
        relation_to_target: str,
        target_document_id: str | None,
        related_document_title: str | None,
        issued_at: str | None,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> int:
        collection_name = category.lower().replace(" ", "_")
        self.ensure_collection(collection_name, len(embeddings[0]))

        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, embeddings, strict=False)):
            article_number, article_title = self._extract_article_fields(chunk)
            points.append(
                PointStruct(
                    id=self._stable_point_id(document_id, idx),
                    vector=vector,
                    payload={
                        "document_id": document_id,
                        "document_title": document_title,
                        "document_name": document_name,
                        "document_type": legal_type,
                        "legal_status": legal_status,
                        "date_publication": date_publication,
                        "date_entree_vigueur": date_entree_vigueur,
                        "relation_type": relation_to_target,
                        "related_document_id": target_document_id,
                        "related_document_title": related_document_title,
                        "realized_at": issued_at,
                        "category": category,
                        "chunk_index": idx,
                        "article_number": article_number,
                        "article_title": article_title,
                        "text": chunk,
                    },
                )
            )

        self.client.upsert(collection_name=collection_name, points=points)
        return len(points)

    @staticmethod
    def _stable_point_id(document_id: str, chunk_index: int) -> int:
        """Return a collision-resistant 63-bit integer ID.

        Python's built-in hash() is randomised per process (PYTHONHASHSEED),
        so the same document+index pair can produce a different ID after a
        restart, potentially creating orphan or duplicate Qdrant points.
        SHA-256 is deterministic across restarts and environments.
        """
        raw = f"{document_id}:{chunk_index}".encode()
        return int(hashlib.sha256(raw).hexdigest()[:15], 16)  # 60-bit, always positive

    @staticmethod
    def _extract_article_fields(chunk_text: str) -> tuple[str | None, str | None]:
        """Extract (article_number, article_title) from the first line of a chunk.

        Handles both plain article headers ('Article 5 - Titre') and the
        bracket-prefixed continuation format ('[Article 5 - Titre] ...').
        Returns (None, None) when the chunk does not start with an article marker.
        """
        first_part = (
            chunk_text.lstrip("[").split("]", 1)[0]
            if chunk_text.startswith("[")
            else chunk_text.split("\n", 1)[0]
        )
        first_part = first_part.strip()

        match = _ARTICLE_RE.search(first_part)
        if not match:
            return None, None

        num_match = re.search(
            r"Premier|1er|\d+(?:bis|ter|quater|quinquies)?",
            match.group(0),
            re.IGNORECASE,
        )
        article_number = num_match.group(0).strip() if num_match else None
        after = first_part[match.end():].lstrip(" -:–—.").strip()
        article_title = after[:120] if after else None
        return article_number, article_title

    def delete_by_document(self, category: str, document_id: str) -> None:
        collection_name = self._to_collection_name(category)
        if not self.collection_exists(collection_name):
            return

        self.client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )

    def get_all_collections(self) -> list[str]:
        collections = self.client.get_collections().collections
        return [collection.name for collection in collections]

    def search(
        self,
        category: str,
        query_vector: list[float],
        limit: int,
        document_id: str | None = None,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        collection_name = self._to_collection_name(category)

        if not self.collection_exists(collection_name):
            return []

        query_filter = self._build_query_filter(document_id=document_id, query_mode=query_mode)
        fallback_filter = self._build_query_filter(document_id=document_id, query_mode="future_preview")

        response = None
        try:
            # En mode courant, Qdrant filtre les textes futurs grace a date_entree_vigueur.
            response = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter,
            )
        except Exception:
            if query_mode != "current":
                raise
            self.logger.warning(
                "Qdrant datetime filter FAILED for collection=%s (query_mode=current). "
                "Retrying without date filter — results may include future documents. "
                "Re-index the collection to fix the date_entree_vigueur payload index.",
                collection_name,
                exc_info=True,
            )
            response = self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=fallback_filter,
            )

        points = response.points if hasattr(response, "points") else []

        chunks = [self._point_to_chunk(point, category) for point in points]
        return [
            chunk
            for chunk in chunks
            if self._matches_query_mode(chunk, query_mode)
        ]

    def get_all_chunks(
        self,
        category: str,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        collection_name = self._to_collection_name(category)
        if not self.collection_exists(collection_name):
            return []

        query_filter = self._build_query_filter(document_id=None, query_mode=query_mode)
        fallback_filter = self._build_query_filter(document_id=None, query_mode="future_preview")

        all_chunks: list[dict] = []
        offset = None

        while True:
            try:
                # Scroll pagine tout le corpus d'une categorie pour construire le classement BM25.
                points, next_offset = self.client.scroll(
                    collection_name=collection_name,
                    scroll_filter=query_filter,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
            except Exception:
                if query_mode != "current":
                    raise
                self.logger.warning(
                    "Qdrant scroll datetime filter FAILED for collection=%s (query_mode=current). "
                    "Retrying without date filter — BM25 corpus may include future documents. "
                    "Re-index the collection to fix the date_entree_vigueur payload index.",
                    collection_name,
                    exc_info=True,
                )
                points, next_offset = self.client.scroll(
                    collection_name=collection_name,
                    scroll_filter=fallback_filter,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )

            all_chunks.extend(self._point_to_chunk(point, category) for point in points)

            if next_offset is None:
                break
            offset = next_offset

        return [chunk for chunk in all_chunks if self._matches_query_mode(chunk, query_mode)]

    def _build_query_filter(
        self,
        *,
        document_id: str | None,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> Filter | None:
        must_conditions = []
        if document_id:
            must_conditions.append(
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id),
                )
            )

        if query_mode == "current":
            # Les questions courantes ne doivent pas utiliser des textes pas encore en vigueur.
            must_conditions.append(
                FieldCondition(
                    key="date_entree_vigueur",
                    range=DatetimeRange(lte=datetime.now(UTC)),
                )
            )

        return Filter(must=must_conditions) if must_conditions else None

    @staticmethod
    def _point_to_chunk(point: object, category: str) -> dict:
        payload = getattr(point, "payload", None) or {}
        chunk_text: str = payload.get("text", "")
        # Compatibilite anciens index: si article_number/article_title n'existent pas,
        # on les recalcule depuis le texte du chunk.
        article_number = payload.get("article_number") or QdrantRepository._extract_article_fields(chunk_text)[0]
        article_title = payload.get("article_title") or QdrantRepository._extract_article_fields(chunk_text)[1]
        return {
            "score": getattr(point, "score", 0.0),
            "text": chunk_text,
            "document_id": payload.get("document_id", ""),
            "document_title": payload.get("document_title", ""),
            "document_name": payload.get("document_name", ""),
            "document_type": payload.get("document_type", ""),
            "legal_status": payload.get("legal_status", "actif"),
            "date_publication": payload.get("date_publication"),
            "date_entree_vigueur": payload.get("date_entree_vigueur"),
            "relation_type": payload.get("relation_type", "none"),
            "related_document_id": payload.get("related_document_id"),
            "related_document_title": payload.get("related_document_title", ""),
            "realized_at": payload.get("realized_at"),
            "category": payload.get("category", category),
            "chunk_index": payload.get("chunk_index", -1),
            "article_number": article_number,
            "article_title": article_title,
        }

    @classmethod
    def _matches_query_mode(
        cls,
        chunk: dict,
        query_mode: Literal["current", "future_preview", "comparison"],
    ) -> bool:
        if query_mode != "current":
            return True

        effective_date = cls._parse_date(chunk.get("date_entree_vigueur"))
        if effective_date is None:
            return False
        return effective_date <= datetime.now(UTC).date()

    @staticmethod
    def _parse_date(value: object) -> date | None:
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

    def search_within_document(
        self,
        *,
        category: str,
        document_id: str,
        query_vector: list[float],
        limit: int,
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> list[dict]:
        return self.search(
            category=category,
            query_vector=query_vector,
            limit=limit,
            document_id=document_id,
            query_mode=query_mode,
        )
