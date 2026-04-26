from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_finance_or_admin_user
from app.schemas import DocumentActionResponse, DocumentCategory, DocumentPreviewOut, DocumentSearchResponse

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.get("", response_model=DocumentSearchResponse)
async def search_documents(
    request: Request,
    query: Annotated[str | None, Query()] = None,
    title: Annotated[str | None, Query()] = None,
    categories: Annotated[list[DocumentCategory] | None, Query()] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    favorites_only: Annotated[bool, Query()] = False,
    sort_by: Annotated[str, Query(pattern="^(recent|title)$")] = "recent",
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d indexation de document non disponible.")

    current_user = getattr(request.state, "current_user", None) or {}
    return service.search_documents(
        query=query,
        title=title,
        categories=[item.value for item in categories] if categories else None,
        date_from=date_from,
        date_to=date_to,
        favorites_only=favorites_only,
        current_user_id=current_user.get("id"),
        sort_by=sort_by,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}/preview", response_model=DocumentPreviewOut)
async def get_document_preview(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d indexation de document non disponible.")

    return service.get_document_preview(document_id)


@router.get("/{document_id}/file")
async def get_document_file(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d indexation de document non disponible.")

    file_path, media_type = service.get_document_file_response_data(document_id)
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
    )


@router.post("/{document_id}/favorite", response_model=DocumentActionResponse)
async def add_document_to_favorites(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d indexation de document non disponible.")

    current_user = getattr(request.state, "current_user", None) or {}
    return service.set_document_favorite(
        document_id,
        True,
        current_user_id=str(current_user.get("id", "")),
    )


@router.delete("/{document_id}/favorite", response_model=DocumentActionResponse)
async def remove_document_from_favorites(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Service d indexation de document non disponible.")

    current_user = getattr(request.state, "current_user", None) or {}
    return service.set_document_favorite(
        document_id,
        False,
        current_user_id=str(current_user.get("id", "")),
    )
