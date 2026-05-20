from typing import Any

from fastapi import Request


def get_current_user(request: Request) -> dict[str, Any]:
    return getattr(request.state, "current_user", None) or {}


def get_optional_audit_service(request: Request) -> Any | None:
    return getattr(request.app.state, "audit_service", None)


def try_log_audit(request: Request, method_name: str, **kwargs: Any) -> None:
    audit_service = get_optional_audit_service(request)
    if audit_service is None:
        return

    method = getattr(audit_service, method_name, None)
    if method is None:
        return

    try:
        method(**kwargs)
    except Exception:
        pass
