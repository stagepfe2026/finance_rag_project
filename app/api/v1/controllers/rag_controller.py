# app/api/v1/controllers/rag_controller.py
from app.schemas.rag_schema import AskRequest
from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


@router.post("/ask")
async def ask_question(request: Request, payload: AskRequest):
    service = getattr(request.app.state, "rag_service", None)

    if service is None:
        raise HTTPException(
            status_code=500,
            detail="Service RAG non disponible.",
        )

    try:
        result = service.ask(
            question=payload.question,
        )

        return {
            "success": True,
            "message": "Reponse generee avec succes.",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
