from datetime import datetime, timedelta, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.security import hash_session_token
from app.repositories import SessionsRepository, UsersRepository


class AuthSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.sessions_repo = SessionsRepository()
        self.users_repo = UsersRepository()

    async def dispatch(self, request: Request, call_next):
        request.state.current_user = None
        request.state.current_session = None
        request.state.session_expires_at = None
        request.state.session_error_code = None

        raw_token = request.cookies.get(settings.auth_session_cookie_name)
        if raw_token:
            token_hash = hash_session_token(raw_token)
            session = self.sessions_repo.get_active_session_by_token_hash(token_hash)
            if session:
                now = datetime.now(timezone.utc)

                if session.absolute_expires_at <= now or session.refresh_expires_at <= now:
                    self.sessions_repo.close_session(
                        session.id or "",
                        reason="SESSION_MAX_DURATION_EXPIRED",
                        closed_before_expiry=False,
                    )
                    request.state.session_error_code = "SESSION_MAX_DURATION_EXPIRED"
                elif session.idle_expires_at <= now:
                    self.sessions_repo.close_session(
                        session.id or "",
                        reason="SESSION_IDLE_TIMEOUT",
                        closed_before_expiry=False,
                    )
                    request.state.session_error_code = "SESSION_IDLE_TIMEOUT"
                else:
                    if session.access_expires_at <= now:
                        new_access_expiry = min(
                            now + timedelta(minutes=settings.auth_access_token_minutes),
                            session.refresh_expires_at,
                            session.absolute_expires_at,
                        )
                        self.sessions_repo.refresh_tokens(
                            session.id or "",
                            access_expires_at=new_access_expiry,
                        )
                        session.access_expires_at = new_access_expiry

                    new_idle_expiry = min(
                        now + timedelta(minutes=settings.auth_session_idle_minutes),
                        session.absolute_expires_at,
                    )
                    new_access_expiry = min(
                        now + timedelta(minutes=settings.auth_access_token_minutes),
                        session.refresh_expires_at,
                        session.absolute_expires_at,
                    )
                    self.sessions_repo.touch_activity(
                        session.id or "",
                        access_expires_at=new_access_expiry,
                        idle_expires_at=new_idle_expiry,
                    )
                    session.access_expires_at = new_access_expiry
                    session.idle_expires_at = new_idle_expiry
                    session.last_activity_at = now

                    user = self.users_repo.find_active_by_id(session.user_id)
                    if user:
                        request.state.current_user = user.to_public_dict()
                        request.state.current_session = session
                        request.state.session_expires_at = session.access_expires_at

        response = await call_next(request)
        return response


def build_unauthorized_response(message: str, code: str) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"success": False, "message": message, "code": code},
    )
