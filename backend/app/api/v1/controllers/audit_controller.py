from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.api.dependencies.auth_dependencies import require_admin_user

router = APIRouter(dependencies=[Depends(require_admin_user)])


@router.get("")
async def list_audit_activities(
    request: Request,
    current_user: dict = Depends(require_admin_user),
    user_id: str | None = Query(default=None, alias="userId"),
    action_type: str | None = Query(default=None, alias="actionType"),
    search: str | None = Query(default=None),
    limit: int = Query(default=250, ge=20, le=500),
):
    del current_user
    service = getattr(request.app.state, "audit_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d audit non disponible.")

    try:
        data = service.list_activities(
            user_id=user_id,
            action_type=action_type,
            search=search,
            limit=limit,
        )
        return {
            "success": True,
            "message": "Activites chargees avec succes.",
            "data": data,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
