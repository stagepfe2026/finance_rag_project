from datetime import UTC, datetime
from typing import Any, Literal

from app.models.chat_model import ChatMessageModel, ConversationModel
from app.repositories.chat_repository import ChatRepository
from app.services.rag_service import RagService


class ChatService:
    def __init__(self, rag_service: RagService) -> None:
        self.rag_service = rag_service
        self.chat_repo = ChatRepository()

    def ensure_indexes(self) -> None:
        self.chat_repo.ensure_indexes()

    def list_conversations(self, user_id: str) -> list[dict[str, Any]]:
        conversations = self.chat_repo.list_conversations_for_user(user_id)
        return [self._serialize_conversation(item) for item in conversations]

    def create_conversation(self, user_id: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        conversation = ConversationModel(
            user_id=user_id,
            summary="Nouvelle discussion",
            created_at=now,
            updated_at=now,
        )
        created = self.chat_repo.create_conversation(conversation)
        return self._serialize_conversation(created)

    def rename_conversation(self, user_id: str, conversation_id: str, summary: str) -> dict[str, Any]:
        normalized_summary = " ".join(summary.split()).strip()
        if not normalized_summary:
            raise ValueError("EMPTY_SUMMARY")

        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.rename_conversation(conversation_id, normalized_summary)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def archive_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.archive_conversation(conversation_id)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def restore_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        updated = self.chat_repo.restore_conversation(conversation_id)
        if updated is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        return self._serialize_conversation(updated)

    def delete_conversation(self, user_id: str, conversation_id: str) -> None:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")

        deleted = self.chat_repo.delete_conversation(conversation_id)
        if not deleted:
            raise ValueError("CONVERSATION_NOT_FOUND")

    def list_messages(self, user_id: str, conversation_id: str) -> list[dict[str, Any]]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        messages = self.chat_repo.list_messages_for_conversation(conversation_id)
        return [self._serialize_message(item) for item in messages]

    def ask(
        self,
        *,
        user_id: str,
        content: str,
        conversation_id: str | None = None,
        response_mode: Literal["short", "detailed"] = "detailed",
    ) -> dict[str, Any]:
        normalized_content = content.strip()
        if len(normalized_content) < 1:
            raise ValueError("EMPTY_MESSAGE")

        if conversation_id:
            conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
            if conversation is None:
                raise ValueError("CONVERSATION_NOT_FOUND")
        else:
            now = datetime.now(UTC)
            conversation = self.chat_repo.create_conversation(
                ConversationModel(
                    user_id=user_id,
                    summary=self._make_summary(normalized_content),
                    created_at=now,
                    updated_at=now,
                )
            )

        user_message = self.chat_repo.create_message(
            ChatMessageModel(
                conversation_id=conversation.id or "",
                role="user",
                content=normalized_content,
                created_at=datetime.now(UTC),
            )
        )

        rag_result = self._ask_assistant(normalized_content, response_mode=response_mode)
        assistant_sources = self._normalize_sources(rag_result.get("sources", []))
        assistant_message = self.chat_repo.create_message(
            ChatMessageModel(
                conversation_id=conversation.id or "",
                role="assistant",
                content=str(rag_result.get("answer", "")),
                created_at=datetime.now(UTC),
                sources=assistant_sources,
            )
        )

        updated_conversation = self.chat_repo.update_conversation_after_message(
            conversation.id or "",
            summary=self._make_summary(normalized_content),
        )

        return {
            "conversation": self._serialize_conversation(updated_conversation or conversation),
            "userMessage": self._serialize_message(user_message),
            "assistantMessage": self._serialize_message(assistant_message),
            "sources": assistant_sources,
        }

    def _ask_assistant(self, question: str, response_mode: Literal["short", "detailed"] = "detailed") -> dict[str, Any]:
        try:
            return self.rag_service.ask(question=question, response_mode=response_mode)
        except Exception:
            return {
                "question": question,
                "detected_categories": [],
                "answer": "Le service de recherche documentaire est temporairement indisponible. Verifiez que Qdrant et le moteur de generation sont bien demarres, puis reessayez.",
                "sources": [],
            }

    @staticmethod
    def _normalize_sources(raw_sources: Any) -> list[dict[str, Any]]:
        if not isinstance(raw_sources, list):
            return []

        normalized_sources: list[dict[str, Any]] = []
        seen_document_ids: set[str] = set()

        for item in raw_sources:
            if not isinstance(item, dict):
                continue

            document_id = str(item.get("document_id", "")).strip()
            document_name = str(item.get("document_name", "")).strip()
            dedupe_key = document_id or document_name
            if not dedupe_key or dedupe_key in seen_document_ids:
                continue

            seen_document_ids.add(dedupe_key)
            normalized_sources.append(
                {
                    "document_id": document_id,
                    "category": str(item.get("category", "")).strip(),
                    "document_name": document_name,
                    "document_type": str(item.get("document_type", "")).strip(),
                    "vector_score": float(item.get("vector_score", 0.0)),
                    "lexical_score": float(item.get("lexical_score", 0.0)),
                    "final_score": float(item.get("final_score", 0.0)),
                }
            )

        return normalized_sources

    @staticmethod
    def _make_summary(content: str) -> str:
        compact = " ".join(content.split())
        if len(compact) <= 72:
            return compact
        return f"{compact[:69].rstrip()}..."

    @staticmethod
    def _serialize_conversation(conversation: ConversationModel) -> dict[str, Any]:
        return {
            "_id": conversation.id,
            "summary": conversation.summary,
            "createdAt": conversation.created_at.isoformat(),
            "updatedAt": conversation.updated_at.isoformat(),
            "userId": conversation.user_id,
            "isArchived": conversation.is_archived,
            "archivedAt": conversation.archived_at.isoformat() if conversation.archived_at else None,
        }

    @staticmethod
    def _serialize_message(message: ChatMessageModel) -> dict[str, Any]:
        return {
            "_id": message.id,
            "conversationId": message.conversation_id,
            "role": message.role,
            "content": message.content,
            "createdAt": message.created_at.isoformat(),
            "sources": message.sources,
        }
