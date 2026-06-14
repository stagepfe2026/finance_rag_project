from app.api.dependencies.service_dependencies import get_auth_service
from app.api.utils.audit_helper import get_current_user, try_log_audit
from app.api.utils.error_mapper import AuthErrorCode
from app.api.validators.auth_validator import (
    require_active_session,
    session_error_message,
    validate_csrf_or_raise,
)
from app.core.config import settings
from app.schemas import (
    AuthResponse,
    LoginRequest,
    SessionInfoOut,
)
from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

router = APIRouter()


def _apply_session_cookies(response: Response, *, session_token: str, csrf_token: str) -> None:
    max_age = settings.auth_session_absolute_hours * 60 * 60
    response.set_cookie(
        key=settings.auth_session_cookie_name,
        value=session_token,
        max_age=max_age,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
    )
    response.set_cookie(
        key=settings.auth_csrf_cookie_name,
        value=csrf_token,
        max_age=max_age,
        httponly=False,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
    )


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_session_cookie_name,
        domain=settings.auth_cookie_domain,
        path="/",
    )
    response.delete_cookie(
        key=settings.auth_csrf_cookie_name,
        domain=settings.auth_cookie_domain,
        path="/",
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request):
    auth_service = get_auth_service(request)
    try:
        result = auth_service.sign_in(email=payload.email, password=payload.password)
    except ValueError as exc:
        if exc.args[0] == AuthErrorCode.INVALID_CREDENTIALS:
            try_log_audit(request, "log_failed_login", email=payload.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "INVALID_CREDENTIALS", "message": "Identifiants invalides."},
            ) from exc
        raise

    response = JSONResponse(
        content={
            "success": True,
            "message": "Connexion reussie.",
            "user": auth_service._to_auth_user(result["user"]),
            "redirect_to": result["redirect_to"],
            "session": auth_service.build_session_info(
                current_user=result["user"],
                current_session=result["session"],
            ),
        }
    )
    _apply_session_cookies(
        response,
        session_token=result["session_token"],
        csrf_token=result["csrf_token"],
    )
    try_log_audit(request, "log_login_success", current_user=auth_service._to_auth_user(result["user"]))
    return response



@router.get("/session", response_model=SessionInfoOut)
async def get_session(request: Request):
    auth_service = get_auth_service(request)
    if getattr(request.state, "session_error_code", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": request.state.session_error_code,
                "message": session_error_message(request.state.session_error_code),
            },
        )

    return auth_service.build_session_info(
        current_user=getattr(request.state, "current_user", None),
        current_session=getattr(request.state, "current_session", None),
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_session(request: Request):
    auth_service = get_auth_service(request)
    current_session = getattr(request.state, "current_session", None)
    current_user = getattr(request.state, "current_user", None)
    require_active_session(current_session, current_user)

    try:
        session = auth_service.refresh_session(current_session)
    except ValueError as exc:
        if exc.args[0] == AuthErrorCode.REFRESH_EXPIRED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "REFRESH_EXPIRED", "message": "La session doit etre renouvelee."},
            ) from exc
        raise

    return {
        "success": True,
        "message": "Session rafraichie.",
        "user": auth_service._to_auth_user(current_user),
        "redirect_to": None,
        "session": auth_service.build_session_info(current_user=current_user, current_session=session),
    }


@router.post("/logout", response_model=AuthResponse)
async def logout(
    request: Request,
    response: Response,
    x_csrf_token: str | None = Header(default=None),
):
    auth_service = get_auth_service(request)
    cookie_csrf = request.cookies.get(settings.auth_csrf_cookie_name)
    current_session = getattr(request.state, "current_session", None)
    if current_session is not None:
        validate_csrf_or_raise(
            auth_service,
            cookie_token=cookie_csrf,
            header_token=x_csrf_token,
            current_session=current_session,
        )

    provider_logout_url = await auth_service.logout(current_session)
    payload = {
        "success": True,
        "message": "Deconnexion reussie.",
        "user": None,
        "redirect_to": provider_logout_url or "/login",
        "session": {
            "authenticated": False,
            "user": None,
            "access_expires_at": None,
            "refresh_expires_at": None,
            "idle_expires_at": None,
            "absolute_expires_at": None,
            "message": None,
        },
    }
    json_response = JSONResponse(content=payload)
    _clear_session_cookies(json_response)
    try_log_audit(request, "log_logout", current_user=get_current_user(request))
    return json_response
