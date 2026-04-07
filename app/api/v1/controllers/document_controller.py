# app/api/v1/controllers/document_controller.py
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

router = APIRouter()


@router.post("/index")
async def index_document(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    category: Annotated[str, Form(...)],
):
    allowed_types = [".pdf", ".docx"]

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")

    if not any(file.filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF et DOCX sont supportes.",
        )

    service = getattr(request.app.state, "document_index_service", None)
    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service d'indexation de document non disponible.",
        )

    try:
        result = await service.index_document(file, category)
        return {
            "success": True,
            "message": "Document indexe avec succes.",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
