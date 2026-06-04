import logging
import re
from datetime import UTC, datetime
from typing import Any, Literal

from app.models.chat_model import ChatMessageModel, ConversationModel
from app.repositories.chat_repository import ChatRepository
from app.services.chat.chat_stats_service import ChatStatsService
from app.services.chat.conversation_service import ConversationService
from app.services.rag.pipeline.rag_service import RagService


class ChatService:
    def __init__(self, rag_service: RagService) -> None:
        self.rag_service = rag_service
        self.chat_repo = ChatRepository()
        self.logger = logging.getLogger(__name__)
        self.conversation_service = ConversationService(self.chat_repo)
        self.stats_service = ChatStatsService(self.chat_repo)

    def ensure_indexes(self) -> None:
        self.chat_repo.ensure_indexes()

    # ------------------------------------------------------------------
    # Conversation delegates → ConversationService
    # ------------------------------------------------------------------

    def get_conversations(self, user_id: str) -> list[dict[str, Any]]:
        return self.conversation_service.get_conversations(user_id)

    def start_conversation(self, user_id: str) -> dict[str, Any]:
        return self.conversation_service.start_conversation(user_id)

    def rename_conversation(self, user_id: str, conversation_id: str, summary: str) -> dict[str, Any]:
        return self.conversation_service.rename_conversation(user_id, conversation_id, summary)

    def archive_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        return self.conversation_service.archive_conversation(user_id, conversation_id)

    def restore_conversation(self, user_id: str, conversation_id: str) -> dict[str, Any]:
        return self.conversation_service.restore_conversation(user_id, conversation_id)

    def delete_conversation(self, user_id: str, conversation_id: str) -> None:
        self.conversation_service.delete_conversation(user_id, conversation_id)

    # ------------------------------------------------------------------
    # Stats delegates → ChatStatsService
    # ------------------------------------------------------------------

    def get_feedback_stats(self) -> dict[str, Any]:
        return self.stats_service.get_feedback_stats()

    # ------------------------------------------------------------------
    # Message-level operations (owned by ChatService)
    # ------------------------------------------------------------------

    def get_messages(self, user_id: str, conversation_id: str) -> list[dict[str, Any]]:
        conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
        if conversation is None:
            raise ValueError("CONVERSATION_NOT_FOUND")
        messages = self.chat_repo.list_for_conversation(conversation_id)
        return [self._serialize_message(item) for item in messages]

    def set_message_feedback(self, user_id: str, message_id: str, feedback: str | None) -> dict[str, Any]:
        if feedback not in {"like", "dislike", None}:
            raise ValueError("INVALID_FEEDBACK")

        message = self.chat_repo.get_for_user(message_id, user_id)
        if message is None:
            raise ValueError("MESSAGE_NOT_FOUND")

        updated = self.chat_repo.save_feedback(message_id, user_id, feedback)
        if updated is None:
            raise ValueError("MESSAGE_NOT_FOUND")
        return self._serialize_message(updated)

    def ask_pending(
        self,
        *,
        user_id: str,
        content: str,
        conversation_id: str | None = None,
        response_mode: Literal["short", "detailed"] = "detailed",
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> dict[str, Any]:
        """Save user + assistant (generating) messages and return immediately."""
        normalized_content = content.strip()
        if len(normalized_content) < 1:
            raise ValueError("EMPTY_MESSAGE")

        if conversation_id:
            conversation = self.chat_repo.get_conversation_for_user(conversation_id, user_id)
            if conversation is None:
                raise ValueError("CONVERSATION_NOT_FOUND")
        else:
            now = datetime.now(UTC)
            conversation = self.chat_repo.create(
                ConversationModel(
                    user_id=user_id,
                    title=self._make_summary(normalized_content),
                    created_at=now,
                    updated_at=now,
                )
            )

        user_message = self.chat_repo.save(
            ChatMessageModel(
                conversation_id=conversation.id or "",
                role="user",
                content=normalized_content,
                created_at=datetime.now(UTC),
                status="completed",
            )
        )

        assistant_message = self.chat_repo.save(
            ChatMessageModel(
                conversation_id=conversation.id or "",
                role="assistant",
                content="",
                created_at=datetime.now(UTC),
                status="generating",
            )
        )

        updated_conversation = self.chat_repo.refresh_after_message(
            conversation.id or "",
            title=self._make_summary(normalized_content),
        )

        return {
            "conversation": self.conversation_service._serialize_conversation(updated_conversation or conversation),
            "userMessage": self._serialize_message(user_message),
            "assistantMessage": self._serialize_message(assistant_message),
            "sources": [],
            "queryMode": query_mode,
        }

    def run_rag_background(
        self,
        *,
        assistant_message_id: str,
        conversation_id: str,
        content: str,
        response_mode: Literal["short", "detailed"] = "detailed",
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
    ) -> None:
        """Run RAG in a background thread and update the assistant message."""
        try:
            conversation_history, previous_doc_ids = self._build_conversation_history(conversation_id, content)
            rag_result = self._ask_assistant(
                content,
                response_mode=response_mode,
                query_mode=query_mode,
                conversation_history=conversation_history,
                previous_doc_ids=previous_doc_ids,
            )
            answer = str(rag_result.get("answer", ""))
            assistant_sources = self._normalize_sources(rag_result.get("sources", []))
            self.chat_repo.update_content(
                assistant_message_id,
                content=answer,
                sources=assistant_sources,
                status="completed",
            )
        except Exception:
            self.logger.exception("Background RAG task failed for message %s.", assistant_message_id)
            self.chat_repo.update_content(
                assistant_message_id,
                content="La generation de la reponse a echoue. Veuillez reessayer.",
                sources=[],
                status="failed",
            )

    def get_generating_messages(self, user_id: str) -> list[dict[str, Any]]:
        """Return all assistant messages currently being generated for a user."""
        messages = self.chat_repo.list_in_progress_for_user(user_id)
        return [self._serialize_message(m) for m in messages]

    def _ask_assistant(
        self,
        question: str,
        response_mode: Literal["short", "detailed"] = "detailed",
        query_mode: Literal["current", "future_preview", "comparison"] = "current",
        conversation_history: str | None = None,
        previous_doc_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        try:
            return self.rag_service.answer(
                question=question,
                response_mode=response_mode,
                query_mode=query_mode,
                conversation_history=conversation_history,
                previous_doc_ids=previous_doc_ids,
            )
        except Exception:
            self.logger.exception("Chat assistant request failed during RAG processing.")
            return {
                "question": question,
                "query_mode": query_mode,
                "detected_categories": [],
                "answer": "Le service de recherche documentaire est temporairement indisponible. Verifiez que Qdrant et le moteur de generation sont bien demarres, puis reessayez.",
                "sources": [],
            }

    def _build_conversation_history(
        self, conversation_id: str, question: str
    ) -> tuple[str | None, list[str] | None]:
        """Return (history_text, previous_doc_ids) for follow-up questions.

        history_text  : formatted Q/A context injected into the LLM prompt.
        previous_doc_ids : document_ids from the previous assistant message sources,
                           used to restrict Qdrant search to the same documents.
        Both are None when the question is independent or no prior exchange exists.
        """
        if not self._is_followup_question(question):
            return None, None

        last_user, last_assistant = self.chat_repo.list_last_completed_exchange(conversation_id)
        if last_user is None or last_assistant is None:
            return None, None

        answer = last_assistant.content[:600]
        if len(last_assistant.content) > 600:
            answer += "..."

        history_text = (
            f"Question précédente : {last_user.content}\n"
            f"Réponse précédente : {answer}"
        )

        # Extract document_ids from the previous assistant message sources.
        previous_doc_ids = [
            str(src.get("document_id", "")).strip()
            for src in (last_assistant.sources or [])
            if str(src.get("document_id", "")).strip()
        ] or None

        return history_text, previous_doc_ids

    @staticmethod
    def _is_followup_question(question: str) -> bool:
        """Return True when the question contains words that reference a previous exchange.

        Detects:
        - Demonstratives: cet, cette, ces, cela, ça, ce cas, ce taux, ce texte
        - Explicit back-references: tu m'as dit, tu as mentionné, au début, précédent
        - Clarification requests: détailler, expliquer, préciser, développer
        - Continuation markers: et pour, et si, et dans ce cas, de même
        - Pronouns in context: il s'applique, elle concerne (only when starting the question)
        """
        q = question.strip().lower()

        patterns = [
            r"\bcet\s+\w+",                        # cet avantage, cet article
            r"\bcette\s+\w+",                       # cette loi, cette règle
            r"\bces\s+\w+",                         # ces taux, ces dispositions
            r"\bcela\b", r"\bça\b",
            r"\bce\s+(?:cas|taux|texte|article|avantage|droit|régime|taux|principe)\b",
            r"\btu\s+m.as\b",                       # tu m'as dit / donné / mentionné
            r"\btu\s+as\s+(?:mentionné|cité|dit|indiqué|précisé)\b",
            r"\bau\s+début\b",
            r"\btout\s+à\s+l.heure\b",
            r"\bprécéd(?:ent|ente|emment)\b",
            r"\bmentionné\b", r"\bcité\b", r"\bévoqué\b",
            r"\bdont\s+tu\b",
            r"\bmême\s+(?:loi|cas|avantage|taux|règle|article)\b",
            r"\bdétaill(?:er|e)\b",
            r"\bprécis(?:er|e)\b",
            r"\bdévelopp(?:er|e)\b",
            r"\bclarifi(?:er|e)\b",
            r"\bet\s+(?:pour|si|dans\s+ce\s+cas)\b",
            r"\bégalement\b",
            r"^(?:il|elle)\s+(?:s.applique|concerne|prévoit|stipule|dispose)\b",
        ]

        return any(re.search(p, q) for p in patterns)

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
                    "legal_status": str(item.get("legal_status", "actif")).strip(),
                    "date_publication": item.get("date_publication"),
                    "date_entree_vigueur": item.get("date_entree_vigueur"),
                    "relation_type": str(item.get("relation_type", "none")).strip(),
                    "related_document_id": str(item.get("related_document_id", "")).strip() or None,
                    "related_document_title": str(item.get("related_document_title", "")).strip(),
                    "chunk_index": int(item.get("chunk_index", -1)),
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
    def _serialize_message(message: ChatMessageModel) -> dict[str, Any]:
        return {
            "_id": message.id,
            "conversationId": message.conversation_id,
            "role": message.role,
            "content": message.content,
            "createdAt": message.created_at.isoformat(),
            "sources": message.sources,
            "feedback": message.feedback,
            "feedbackAt": message.feedback_at.isoformat() if message.feedback_at else None,
            "status": message.status,
        }
