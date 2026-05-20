from collections.abc import Mapping
from typing import Any

from pymongo.database import Database

from app.core.config import settings
from app.infrastructure.database.validators.audit_events_validator import AUDIT_EVENTS_VALIDATOR
from app.infrastructure.database.validators.auth_sessions_validator import AUTH_SESSIONS_VALIDATOR
from app.infrastructure.database.validators.chat_conversations_validator import (
    CHAT_CONVERSATIONS_VALIDATOR,
)
from app.infrastructure.database.validators.chat_messages_validator import CHAT_MESSAGES_VALIDATOR
from app.infrastructure.database.validators.documents_validator import DOCUMENTS_VALIDATOR
from app.infrastructure.database.validators.notifications_validator import NOTIFICATIONS_VALIDATOR
from app.infrastructure.database.validators.reclamations_validator import RECLAMATIONS_VALIDATOR
from app.infrastructure.database.validators.users_validator import USERS_VALIDATOR


def apply_mongodb_validator(
    db: Database,
    collection_name: str,
    validator: Mapping[str, Any],
) -> None:
    if collection_name not in db.list_collection_names():
        db.create_collection(
            collection_name,
            validator=dict(validator),
            validationLevel="moderate",
            validationAction="error",
        )
        return

    db.command(
        {
            "collMod": collection_name,
            "validator": dict(validator),
            "validationLevel": "moderate",
            "validationAction": "error",
        }
    )


def ensure_mongodb_validators(db: Database) -> None:
    validators = {
        settings.mongodb_users_collection: USERS_VALIDATOR,
        settings.mongodb_sessions_collection: AUTH_SESSIONS_VALIDATOR,
        settings.mongodb_documents_collection: DOCUMENTS_VALIDATOR,
        settings.mongodb_chat_conversations_collection: CHAT_CONVERSATIONS_VALIDATOR,
        settings.mongodb_chat_messages_collection: CHAT_MESSAGES_VALIDATOR,
        settings.mongodb_reclamations_collection: RECLAMATIONS_VALIDATOR,
        settings.mongodb_notifications_collection: NOTIFICATIONS_VALIDATOR,
        "audit_events": AUDIT_EVENTS_VALIDATOR,
    }

    for collection_name, validator in validators.items():
        apply_mongodb_validator(db, collection_name, validator)
