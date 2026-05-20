from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.dependencies.auth_dependencies import require_admin_user, require_finance_or_admin_user
from app.api.dependencies.service_dependencies import get_dashboard_service
from app.schemas.dashboard_schema import AdminDashboardOut, UserDashboardOut

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/user-home", response_model=UserDashboardOut)
async def get_user_dashboard(
    request: Request,
    current_user: dict = Depends(require_finance_or_admin_user),
):
    service = get_dashboard_service(request)
    return service.build_user_dashboard(current_user)


@router.get("/admin-overview", response_model=AdminDashboardOut)
async def get_admin_dashboard(
    request: Request,
    current_user: dict = Depends(require_admin_user),
):
    del current_user
    service = get_dashboard_service(request)
    return service.build_admin_dashboard()
