import logging
from datetime import UTC, datetime
from typing import Any

from app.models.chat_model import ConversationModel
from app.repositories.chat_repository import ChatRepository


class ConversationService:
    def __init__(self, chat_repository: ChatRepository) -> None:
        self.chat_repo = chat_repository
        self.logger = logging.getLogger(__name__)

    def get_conversations(self, user_id: str) -> list[dict[str, Any]]:
        conversations = self.chat_repo.list_for_user(user_id)
        return [self._serialize_conversation(item) for item in conversations]

    def start_conversation(self, user_id: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        conversation = ConversationModel(
            user_id=user_id,
            title="Nouvelle discussion",
            created_at=now,
            updated_at=now,
        )
        created = self.chat_repo.create(conversation)
        return self._serialize_conversation(created)

    def rename_conversation(self, user_id: str, conversation_id: str, summary: str) -> dict[str, Any]:
        normalized_summary = " ".join(summary.split()).strip()
        if not normalized_summary:
            raise ValueError("EMPTY_SUMMARY")

        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.rename(conversation_id, normalized_summary)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def archive_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.archive(conversation_id)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def restore_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.restore(conversation_id)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def delete_conversation(self, user_id: str, conversation_id: str) -> None:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        deleted = self.chat_repo.delete(conversation_id)
        if not deleted:
            raise ValueError("CONVERSATION_NOT_FOUND")

    @staticmethod
    def _serialize_conversation(conversation: ConversationModel) -> dict[str, Any]:
        return {
            "_id": conversation.id,
            "title": conversation.title,
            "createdAt": conversation.created_at.isoformat(),
            "updatedAt": conversation.updated_at.isoformat(),
            "userId": conversation.user_id,
            "isArchived": conversation.is_archived,
            "archivedAt": conversation.archived_at.isoformat() if conversation.archived_at else None,
        }
