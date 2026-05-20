from typing import Any

from fastapi import HTTPException, status


SESSION_ERROR_MESSAGES = {
    "SESSION_IDLE_TIMEOUT": "Votre session a expire. Veuillez vous reconnecter.",
    "SESSION_MAX_DURATION_EXPIRED": "Votre session a atteint sa duree maximale. Veuillez vous reconnecter.",
}


def session_error_message(code: str) -> str:
    return SESSION_ERROR_MESSAGES.get(code, "Session invalide.")


def require_active_session(current_session: Any, current_user: Any) -> None:
    if current_session and current_user:
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "UNAUTHORIZED", "message": "Session invalide ou expiree."},
    )


def validate_csrf_or_raise(
    auth_service: Any,
    *,
    cookie_token: str | None,
    header_token: str | None,
    current_session: Any,
) -> None:
    if auth_service.validate_csrf(
        cookie_token=cookie_token,
        header_token=header_token,
        current_session=current_session,
    ):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "CSRF_INVALID", "message": "Jeton CSRF invalide."},
    )
