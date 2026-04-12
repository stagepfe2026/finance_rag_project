from fastapi import HTTPException, Request, status


def require_authenticated_user(request: Request) -> dict:
    current_user = getattr(request.state, "current_user", None)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentification requise."},
        )
    return current_user


def require_admin_user(request: Request) -> dict:
    current_user = require_authenticated_user(request)
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Acces reserve aux administrateurs."},
        )
    return current_user


def require_finance_or_admin_user(request: Request) -> dict:
    current_user = require_authenticated_user(request)
    if current_user.get("role") not in {"ADMIN", "FINANCE_USER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Role non autorise."},
        )
    return current_user
