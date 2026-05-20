from typing import Any

from fastapi import HTTPException, Request, WebSocket


def require_service(request: Request, state_name: str, detail: str) -> Any:
    service = getattr(request.app.state, state_name, None)
    if service is None:
        raise HTTPException(status_code=500, detail=detail)
    return service


def get_auth_service(request: Request) -> Any:
    return require_service(request, "auth_service", "Service d authentification non disponible.")


def get_audit_service(request: Request) -> Any:
    return require_service(request, "audit_service", "Service d audit non disponible.")


def get_chat_service(request: Request) -> Any:
    return require_service(request, "chat_service", "Service de chat non disponible.")


def get_dashboard_service(request: Request) -> Any:
    return require_service(request, "dashboard_service", "Service dashboard non disponible.")


def get_document_index_service(request: Request) -> Any:
    return require_service(
        request,
        "document_index_service",
        "Service d indexation de document non disponible.",
    )


def get_notification_service(request: Request) -> Any:
    return require_service(request, "notification_service", "Service de notification non disponible.")


def get_notification_service_from_websocket(websocket: WebSocket) -> Any | None:
    return getattr(websocket.app.state, "notification_service", None)


def get_rag_service(request: Request) -> Any:
    return require_service(request, "rag_service", "Service RAG non disponible.")


def get_reclamation_service(request: Request) -> Any:
    return require_service(request, "reclamation_service", "Service reclamation non disponible.")
