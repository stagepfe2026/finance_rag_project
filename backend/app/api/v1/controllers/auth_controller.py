from app.core.config import settings
from app.schemas import (
    AuthResponse,
    LoginRequest,
    OidcLoginStartOut,
    ProfileUpdateRequest,
    SessionInfoOut,
)
from app.services.auth_service import AuthService
from fastapi import APIRouter, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse

router = APIRouter()
auth_service = AuthService()


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


def _session_error_message(code: str) -> str:
    messages = {
        "SESSION_IDLE_TIMEOUT": "Votre session a expire. Veuillez vous reconnecter.",
        "SESSION_MAX_DURATION_EXPIRED": "Votre session a atteint sa duree maximale. Veuillez vous reconnecter.",
    }
    return messages.get(code, "Session invalide.")


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    try:
        result = auth_service.login_with_password(email=payload.email, password=payload.password)
    except ValueError as exc:
        if str(exc) == "INVALID_CREDENTIALS":
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
    return response


@router.get("/oidc/login", response_model=OidcLoginStartOut)
async def start_oidc_login():
    result = await auth_service.start_oidc_login()
    response = JSONResponse(content={"authorization_url": result["authorization_url"]})
    response.set_cookie(
        key="rag_finance_oidc_state",
        value=result["state"],
        max_age=600,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        domain=settings.auth_cookie_domain,
        path="/",
    )
    return response


@router.get("/callback")
async def oidc_callback(request: Request, code: str, state: str | None = None):
    expected_state = request.cookies.get("rag_finance_oidc_state")
    if expected_state and state != expected_state:
        return RedirectResponse(url=f"{settings.auth_frontend_base_url}/login?error=oidc_state")

    try:
        result = await auth_service.handle_oidc_callback(code=code)
    except Exception:
        return RedirectResponse(url=f"{settings.auth_frontend_base_url}/login?error=oidc_callback")

    response = RedirectResponse(url=f"{settings.auth_frontend_base_url}{result['redirect_to']}")
    _apply_session_cookies(
        response,
        session_token=result["session_token"],
        csrf_token=result["csrf_token"],
    )
    response.delete_cookie("rag_finance_oidc_state", domain=settings.auth_cookie_domain, path="/")
    return response


@router.get("/session", response_model=SessionInfoOut)
async def get_session(request: Request):
    if getattr(request.state, "session_error_code", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": request.state.session_error_code,
                "message": _session_error_message(request.state.session_error_code),
            },
        )

    return auth_service.build_session_info(
        current_user=getattr(request.state, "current_user", None),
        current_session=getattr(request.state, "current_session", None),
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_session(request: Request):
    current_session = getattr(request.state, "current_session", None)
    current_user = getattr(request.state, "current_user", None)
    if not current_session or not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Session invalide ou expiree."},
        )

    try:
        session = auth_service.refresh_session(current_session)
    except ValueError as exc:
        if str(exc) == "REFRESH_EXPIRED":
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


@router.patch("/profile", response_model=AuthResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    x_csrf_token: str | None = Header(default=None),
):
    cookie_csrf = request.cookies.get(settings.auth_csrf_cookie_name)
    current_session = getattr(request.state, "current_session", None)
    current_user = getattr(request.state, "current_user", None)
    if not current_session or not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Session invalide ou expiree."},
        )

    if not auth_service.validate_csrf(
        cookie_token=cookie_csrf,
        header_token=x_csrf_token,
        current_session=current_session,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "CSRF_INVALID", "message": "Jeton CSRF invalide."},
        )

    try:
        updated_user = auth_service.update_profile(
            user_id=str(current_user.get("id", "")),
            payload=payload.model_dump(),
        )
    except ValueError as exc:
        if str(exc) == "EMAIL_ALREADY_USED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "EMAIL_ALREADY_USED", "message": "Cette adresse email est deja utilisee."},
            ) from exc
        if str(exc) == "USER_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "USER_NOT_FOUND", "message": "Utilisateur introuvable."},
            ) from exc
        raise

    return {
        "success": True,
        "message": "Donnees personnelles mises a jour.",
        "user": auth_service._to_auth_user(updated_user),
        "redirect_to": None,
        "session": auth_service.build_session_info(
            current_user=updated_user,
            current_session=current_session,
        ),
    }


@router.post("/logout", response_model=AuthResponse)
async def logout(
    request: Request,
    response: Response,
    x_csrf_token: str | None = Header(default=None),
):
    cookie_csrf = request.cookies.get(settings.auth_csrf_cookie_name)
    current_session = getattr(request.state, "current_session", None)
    if not auth_service.validate_csrf(
        cookie_token=cookie_csrf,
        header_token=x_csrf_token,
        current_session=current_session,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "CSRF_INVALID", "message": "Jeton CSRF invalide."},
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
    return json_response
