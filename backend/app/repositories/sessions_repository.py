from datetime import datetime, timezone

from bson import ObjectId

from app.core.database import get_sessions_collection
from app.models import SessionModel
from app.repositories.index_helpers import create_partial_unique_string_index


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
                    "lastActivityAt": datetime.now(timezone.utc),
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
            "lastActivityAt": datetime.now(timezone.utc),
        }
        if refresh_expires_at is not None:
            update_fields["refreshExpiresAt"] = refresh_expires_at
        if sso_access_token is not None:
            update_fields["ssoAccessToken"] = sso_access_token
        if sso_refresh_token is not None:
            update_fields["ssoRefreshToken"] = sso_refresh_token

        get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {"$set": update_fields},
        )

    def close(self, session_id: str, *, reason: str, is_early_closure: bool) -> None:
        object_id = self._parse_id(session_id)
        if not object_id:
            return

        get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(timezone.utc),
                    "closureReason": reason,
                    "isEarlyClosure": is_early_closure,
                }
            },
        )

    def close_all_for_user(self, user_id: str, *, reason: str) -> None:
        get_sessions_collection().update_many(
            {"userId": user_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(timezone.utc),
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

    @staticmethod
    def _parse_id(session_id: str) -> ObjectId | None:
        try:
            return ObjectId(session_id)
        except Exception:
            return None
