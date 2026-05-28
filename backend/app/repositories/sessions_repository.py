import logging
from datetime import UTC, datetime

from app.core.database import get_sessions_collection
from app.models import SessionModel
from app.repositories.index_helpers import create_partial_unique_string_index
from bson import ObjectId

_logger = logging.getLogger(__name__)


class SessionsRepository:
    def open_session(self, session: SessionModel) -> str:
        result = get_sessions_collection().insert_one(session.to_mongo_insert())
        return str(result.inserted_id)

    def find_by_token(self, token_hash: str) -> SessionModel | None:
        raw = get_sessions_collection().find_one({"hashedToken": token_hash, "closedAt": None})
        if not raw:
            return None
        return SessionModel.from_mongo(raw)

    def extend_activity(self, session_id: str, *, access_expires_at: datetime, idle_expires_at: datetime) -> None:
        object_id = self._parse_id(session_id)
        if not object_id:
            return

        get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {
                "$set": {
                    "lastActivityAt": datetime.now(UTC),
                    "expiresAt": access_expires_at,
                    "idleExpiresAt": idle_expires_at,
                }
            },
        )

    def renew_tokens(
        self,
        session_id: str,
        *,
        access_expires_at: datetime,
        refresh_expires_at: datetime | None = None,
        sso_access_token: str | None = None,
        sso_refresh_token: str | None = None,
    ) -> None:
        object_id = self._parse_id(session_id)
        if not object_id:
            return

        update_fields: dict[str, object] = {
            "expiresAt": access_expires_at,
            "lastActivityAt": datetime.now(UTC),
        }
        if refresh_expires_at is not None:
            update_fields["refreshExpiresAt"] = refresh_expires_at
        if sso_access_token is not None:
            update_fields["ssoAccessToken"] = sso_access_token
        if sso_refresh_token is not None:
            update_fields["ssoRefreshToken"] = sso_refresh_token

        result = get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {"$set": update_fields},
        )
        if result.modified_count == 0:
            _logger.warning("renew_tokens: session %s not found or already closed", session_id)

    def close(self, session_id: str, *, reason: str, is_early_closure: bool) -> None:
        object_id = self._parse_id(session_id)
        if not object_id:
            return

        result = get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(UTC),
                    "closureReason": reason,
                    "isEarlyClosure": is_early_closure,
                }
            },
        )
        if result.modified_count == 0:
            _logger.debug("close: session %s not found or already closed (reason=%s)", session_id, reason)

    def close_all_for_user(self, user_id: str, *, reason: str) -> None:
        get_sessions_collection().update_many(
            {"userId": user_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(UTC),
                    "closureReason": reason,
                    "isEarlyClosure": True,
                }
            },
        )

    def ensure_indexes(self) -> None:
        collection = get_sessions_collection()
        create_partial_unique_string_index(collection, "hashedToken")
        collection.create_index("userId")
        collection.create_index("closedAt")
        collection.create_index("expiresAt")

    def list_recent(self, *, limit: int = 250) -> list[SessionModel]:
        cursor = get_sessions_collection().find({}).sort("createdAt", -1).limit(limit)
        return [SessionModel.from_mongo(raw) for raw in cursor]

    def get_last_closed_session_for_user(self, user_id: str) -> SessionModel | None:
        raw = get_sessions_collection().find_one(
            {"userId": user_id, "closedAt": {"$ne": None}},
            sort=[("createdAt", -1)],
        )
        if not raw:
            return None
        return SessionModel.from_mongo(raw)

    @staticmethod
    def _parse_id(session_id: str) -> ObjectId | None:
        try:
            return ObjectId(session_id)
        except Exception:
            return None
