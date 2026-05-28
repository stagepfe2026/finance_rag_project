from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any


def _as_utc_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
    return datetime.now(UTC)


@dataclass
class SessionModel:
    user_id: str
    hashed_token: str
    csrf_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime
    created_at: datetime
    last_activity_at: datetime
    auth_method: str = "local"
    sso_subject: str | None = None
    sso_access_token: str | None = None
    sso_refresh_token: str | None = None
    closed_at: datetime | None = None
    closure_reason: str | None = None
    is_early_closure: bool | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "SessionModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            hashed_token=str(raw.get("hashedToken", "")),
            csrf_token=str(raw.get("csrfToken", "")),
            access_expires_at=_as_utc_datetime(raw.get("expiresAt")),
            refresh_expires_at=_as_utc_datetime(raw.get("refreshExpiresAt")),
            idle_expires_at=_as_utc_datetime(raw.get("idleExpiresAt")),
            absolute_expires_at=_as_utc_datetime(raw.get("absoluteExpiresAt")),
            created_at=_as_utc_datetime(raw.get("createdAt")),
            last_activity_at=_as_utc_datetime(raw.get("lastActivityAt")),
            auth_method=str(raw.get("authMethod", "local")),
            sso_subject=raw.get("ssoSubject"),
            sso_access_token=raw.get("ssoAccessToken"),
            sso_refresh_token=raw.get("ssoRefreshToken"),
            closed_at=_as_utc_datetime(raw.get("closedAt")) if raw.get("closedAt") else None,
            closure_reason=raw.get("closureReason"),
            is_early_closure=raw.get("isEarlyClosure"),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "hashedToken": self.hashed_token,
            "csrfToken": self.csrf_token,
            "expiresAt": self.access_expires_at,
            "refreshExpiresAt": self.refresh_expires_at,
            "idleExpiresAt": self.idle_expires_at,
            "absoluteExpiresAt": self.absolute_expires_at,
            "createdAt": self.created_at,
            "lastActivityAt": self.last_activity_at,
            "authMethod": self.auth_method,
            "ssoSubject": self.sso_subject,
            "ssoAccessToken": self.sso_access_token,
            "ssoRefreshToken": self.sso_refresh_token,
            "closedAt": self.closed_at,
            "closureReason": self.closure_reason,
            "isEarlyClosure": self.is_early_closure,
        }
