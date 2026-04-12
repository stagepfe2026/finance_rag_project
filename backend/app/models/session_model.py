from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass
class SessionModel:
    user_id: str
    token_hash: str
    csrf_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime
    idle_expires_at: datetime
    absolute_expires_at: datetime
    created_at: datetime
    last_activity_at: datetime
    auth_method: str = "local"
    oidc_subject: str | None = None
    oidc_access_token: str | None = None
    oidc_refresh_token: str | None = None
    closed_at: datetime | None = None
    close_reason: str | None = None
    closed_before_expiry: bool | None = None
    id: str | None = None

    @classmethod
    def from_mongo(cls, raw: dict[str, Any]) -> "SessionModel":
        return cls(
            id=str(raw.get("_id")) if raw.get("_id") is not None else None,
            user_id=str(raw.get("userId", "")),
            token_hash=str(raw.get("tokenHash", "")),
            csrf_token=str(raw.get("csrfToken", "")),
            access_expires_at=raw.get("expiresAt") or datetime.now(timezone.utc),
            refresh_expires_at=raw.get("refreshExpiresAt") or datetime.now(timezone.utc),
            idle_expires_at=raw.get("idleExpiresAt") or datetime.now(timezone.utc),
            absolute_expires_at=raw.get("absoluteExpiresAt") or datetime.now(timezone.utc),
            created_at=raw.get("createdAt") or datetime.now(timezone.utc),
            last_activity_at=raw.get("lastActivityAt") or datetime.now(timezone.utc),
            auth_method=str(raw.get("authMethod", "local")),
            oidc_subject=raw.get("oidcSubject"),
            oidc_access_token=raw.get("oidcAccessToken"),
            oidc_refresh_token=raw.get("oidcRefreshToken"),
            closed_at=raw.get("closedAt"),
            close_reason=raw.get("closeReason"),
            closed_before_expiry=raw.get("closedBeforeExpiry"),
        )

    def to_mongo_insert(self) -> dict[str, Any]:
        return {
            "userId": self.user_id,
            "tokenHash": self.token_hash,
            "csrfToken": self.csrf_token,
            # Kept as expiresAt for readability and compatibility with the requested sample shape.
            "expiresAt": self.access_expires_at,
            "refreshExpiresAt": self.refresh_expires_at,
            "idleExpiresAt": self.idle_expires_at,
            "absoluteExpiresAt": self.absolute_expires_at,
            "createdAt": self.created_at,
            "lastActivityAt": self.last_activity_at,
            "authMethod": self.auth_method,
            "oidcSubject": self.oidc_subject,
            "oidcAccessToken": self.oidc_access_token,
            "oidcRefreshToken": self.oidc_refresh_token,
            "closedAt": self.closed_at,
            "closeReason": self.close_reason,
            "closedBeforeExpiry": self.closed_before_expiry,
        }
