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
    LegalDocumentType,
    LegalRelationType,
    LegalStatus,
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
        current_user = getattr(request.state, "current_user", None) or {}
        return service.list_documents(
            search=search,
            category=category.value if category else None,
            status=status.value if status else None,
            current_user_id=current_user.get("id"),
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
    legal_status: Annotated[str | None, Form()] = None,
    document_type: Annotated[str | None, Form()] = None,
    date_publication: Annotated[str | None, Form()] = None,
    date_entree_vigueur: Annotated[str | None, Form()] = None,
    version: Annotated[str | None, Form()] = None,
    relation_type: Annotated[str | None, Form()] = None,
    related_document_id: Annotated[str | None, Form()] = None,
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
    parsed_date_publication = None
    parsed_date_entree_vigueur = None
    if realized_at:
        try:
            parsed_realized_at = datetime.fromisoformat(realized_at)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="realized_at doit etre une date ISO 8601 valide.",
            ) from exc

    if date_publication:
        try:
            parsed_date_publication = datetime.fromisoformat(date_publication)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="date_publication doit etre une date ISO 8601 valide.",
            ) from exc

    if date_entree_vigueur:
        try:
            parsed_date_entree_vigueur = datetime.fromisoformat(date_entree_vigueur)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail="date_entree_vigueur doit etre une date ISO 8601 valide.",
            ) from exc

    if legal_status and legal_status not in {item.value for item in LegalStatus}:
        raise HTTPException(
            status_code=400,
            detail="legal_status doit etre une valeur valide.",
        )

    if document_type and document_type not in {item.value for item in LegalDocumentType}:
        raise HTTPException(
            status_code=400,
            detail="document_type doit etre une valeur valide.",
        )

    if relation_type and relation_type not in {item.value for item in LegalRelationType}:
        raise HTTPException(
            status_code=400,
            detail="relation_type doit etre une valeur valide.",
        )

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
            legal_status=legal_status,
            document_type=document_type,
            date_publication=parsed_date_publication,
            date_entree_vigueur=parsed_date_entree_vigueur,
            version=version,
            relation_type=relation_type,
            related_document_id=related_document_id,
        )
        return {
            "success": True,
            "message": "Document indexe avec succes.",
            "data": result,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
