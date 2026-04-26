from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.schemas.dashboard_schema import AdminDashboardOut, UserDashboardOut

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/user-home", response_model=UserDashboardOut)
async def get_user_dashboard(
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = getattr(request.app.state, "dashboard_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service dashboard non disponible.")
    return service.get_user_home_dashboard(current_user)


@router.get("/admin-overview", response_model=AdminDashboardOut)
async def get_admin_dashboard(
    request: Request,
    current_user: dict = Depends(require_admin_user),
):
    del current_user
    service = getattr(request.app.state, "dashboard_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service dashboard non disponible.")
    return service.get_admin_overview_dashboard()
