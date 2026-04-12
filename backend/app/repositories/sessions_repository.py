from datetime import datetime, timezone

from bson import ObjectId

from app.core.database import get_sessions_collection
from app.models import SessionModel


class SessionsRepository:
    def create(self, session: SessionModel) -> str:
        result = get_sessions_collection().insert_one(session.to_mongo_insert())
        return str(result.inserted_id)

    def get_active_session_by_token_hash(self, token_hash: str) -> SessionModel | None:
        raw = get_sessions_collection().find_one({"tokenHash": token_hash, "closedAt": None})
        if not raw:
            return None
        return SessionModel.from_mongo(raw)

    def touch_activity(self, session_id: str, *, access_expires_at: datetime, idle_expires_at: datetime) -> None:
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

    def refresh_tokens(
        self,
        session_id: str,
        *,
        access_expires_at: datetime,
        refresh_expires_at: datetime | None = None,
        oidc_access_token: str | None = None,
        oidc_refresh_token: str | None = None,
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
        if oidc_access_token is not None:
            update_fields["oidcAccessToken"] = oidc_access_token
        if oidc_refresh_token is not None:
            update_fields["oidcRefreshToken"] = oidc_refresh_token

        get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {"$set": update_fields},
        )

    def close_session(self, session_id: str, *, reason: str, closed_before_expiry: bool) -> None:
        object_id = self._parse_id(session_id)
        if not object_id:
            return

        get_sessions_collection().update_one(
            {"_id": object_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(timezone.utc),
                    "closeReason": reason,
                    "closedBeforeExpiry": closed_before_expiry,
                }
            },
        )

    def close_all_user_sessions(self, user_id: str, *, reason: str) -> None:
        get_sessions_collection().update_many(
            {"userId": user_id, "closedAt": None},
            {
                "$set": {
                    "closedAt": datetime.now(timezone.utc),
                    "closeReason": reason,
                    "closedBeforeExpiry": True,
                }
            },
        )

    def ensure_indexes(self) -> None:
        collection = get_sessions_collection()
        collection.create_index("tokenHash", unique=True)
        collection.create_index("userId")
        collection.create_index("closedAt")
        collection.create_index("expiresAt")

    @staticmethod
    def _parse_id(session_id: str) -> ObjectId | None:
        try:
            return ObjectId(session_id)
        except Exception:
            return None
