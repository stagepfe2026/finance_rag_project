from app.api.dependencies.auth_dependencies import require_admin_user
from app.api.dependencies.service_dependencies import get_audit_service
from app.api.utils.exception_handler import internal_server_error
from app.api.utils.response_builder import ok_response
from app.api.validators.audit_validator import normalize_audit_filters
from fastapi import APIRouter, Depends, Query, Request

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
    service = get_audit_service(request)
    filters = normalize_audit_filters(user_id=user_id, action_type=action_type, search=search)

    try:
        data = service.get_activities(
            user_id=filters["user_id"],
            action_type=filters["action_type"],
            search=filters["search"],
            limit=limit,
        )
        return ok_response(message="Activites chargees avec succes.", data=data)
    except Exception as exc:
        raise internal_server_error(exc, "Audit activities listing") from exc
