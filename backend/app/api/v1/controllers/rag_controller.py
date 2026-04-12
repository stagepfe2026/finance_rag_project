from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.dependencies.auth_dependencies import require_finance_or_admin_user
from app.schemas.rag_schema import AskRequest

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
