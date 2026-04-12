from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse

from app.api.dependencies.auth_dependencies import require_admin_user
from app.schemas import (
    DocumentActionResponse,
    DocumentCategory,
    DocumentListResponse,
    DocumentPreviewOut,
    DocumentStatus,
)

router = APIRouter(dependencies=[Depends(require_admin_user)])


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    search: Annotated[str | None, Query()] = None,
    category: Annotated[DocumentCategory | None, Query()] = None,
    status: Annotated[DocumentStatus | None, Query()] = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    try:
        return service.list_documents(
            search=search,
            category=category.value if category else None,
            status=status.value if status else None,
            skip=skip,
            limit=limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{document_id}/file")
async def get_document_file(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    file_path, media_type = service.get_document_file_response_data(document_id)
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        headers={"Content-Disposition": f'inline; filename="{file_path.name}"'},
    )


@router.get("/{document_id}/preview", response_model=DocumentPreviewOut)
async def get_document_preview(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    return service.get_document_preview(document_id)


@router.delete("/{document_id}/index", response_model=DocumentActionResponse)
async def delete_document_from_index(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    return service.delete_document_from_index(document_id)


@router.post("/{document_id}/reindex", response_model=DocumentActionResponse)
async def reindex_document(request: Request, document_id: str):
    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    return service.reindex_document(document_id)


@router.post("/index")
async def index_document(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    category: Annotated[str, Form(...)],
    title: Annotated[str, Form(...)],
    description: Annotated[str, Form()] = "",
    realized_at: Annotated[str | None, Form()] = None,
):
    allowed_types = [".pdf", ".docx"]

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")

    if not any(file.filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF et DOCX sont supportes.",
        )

    allowed_categories = {item.value for item in DocumentCategory}
    if category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail="category doit etre une des valeurs suivantes: finance, legal, hr, compliance, other.",
        )

    parsed_realized_at = None
    if realized_at:
        try:
            parsed_realized_at = datetime.fromisoformat(realized_at)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="realized_at doit etre une date ISO 8601 valide.",
            ) from exc

    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d indexation de document non disponible.",
        )

    try:
        result = await service.index_document(
            file=file,
            category=category,
            title=title,
            description=description,
            realized_at=parsed_realized_at,
        )
        return {
            "success": True,
            "message": "Document indexe avec succes.",
            "data": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
