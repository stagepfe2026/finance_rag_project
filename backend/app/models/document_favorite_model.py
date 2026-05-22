from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


@dataclass
class DocumentFavoriteModel:
    document_id: str
    user_id: str
    favorited_at: datetime
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "DocumentFavoriteModel":
        return cls(
            id=str(raw["_id"]) if raw.get("_id") is not None else None,
            document_id=str(raw["documentId"]),
            user_id=str(raw["userId"]),
            favorited_at=raw.get("favoritedAt") or datetime.now(UTC),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "documentId": self.document_id,
            "userId": self.user_id,
            "favoritedAt": self.favorited_at,
        }
