from fastapi import APIRouter, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect, status

from app.api.dependencies.auth_dependencies import require_authenticated_user
from app.schemas.notification_schema import NotificationListResponse, NotificationOut

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    request: Request,
    current_user: dict = Depends(require_authenticated_user),
    limit: int = Query(default=20, ge=1, le=50),
):
    service = getattr(request.app.state, "notification_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de notification non disponible.")
    return service.list_notifications(current_user, limit=limit)


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    request: Request,
    notification_id: str,
    current_user: dict = Depends(require_authenticated_user),
):
    service = getattr(request.app.state, "notification_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service de notification non disponible.")

    try:
        return service.mark_as_read(current_user, notification_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.websocket("/ws")
async def notifications_ws(websocket: WebSocket):
    service = getattr(websocket.app.state, "notification_service", None)
    if service is None:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    current_user = service.authenticate_websocket_user(websocket)
    if current_user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(current_user.get("id", "")).strip()
    await service.manager.connect(user_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        service.manager.disconnect(user_id, websocket)
