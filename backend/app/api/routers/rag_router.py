from app.api.dependencies.auth_dependencies import require_finance_or_admin_user
from app.api.dependencies.service_dependencies import get_rag_service
from app.api.utils.exception_handler import internal_server_error
from app.api.utils.response_builder import ok_response
from app.api.validators.rag_validator import normalize_rag_question
from app.schemas.rag_schema import AskRequest
from fastapi import APIRouter, Depends, Request

router = APIRouter(dependencies=[Depends(require_finance_or_admin_user)])


@router.post("/ask")
async def ask_question(request: Request, payload: AskRequest):
    service = get_rag_service(request)
    question = normalize_rag_question(payload.question)

    try:
        result = service.answer(
            question=question,
            query_mode=payload.query_mode.value,
        )

        return ok_response(message="Reponse generee avec succes.", data=result)
    except Exception as exc:
        raise internal_server_error(exc, "RAG answer generation") from exc
