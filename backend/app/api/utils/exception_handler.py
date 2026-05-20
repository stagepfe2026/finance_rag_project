import logging

from fastapi import HTTPException

logger = logging.getLogger(__name__)


def internal_server_error(exc: Exception, context: str) -> HTTPException:
    logger.exception("%s failed", context, exc_info=exc)
    return HTTPException(status_code=500, detail="Erreur interne du serveur.")
