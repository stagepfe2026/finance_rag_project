from collections import defaultdict
from datetime import UTC, datetime, timedelta
import logging
from typing import Any, Literal

from app.models.chat_model import ChatMessageModel, ConversationModel
from app.repositories.chat_repository import ChatRepository
from app.services.rag_service import RagService


class ChatService:
    def __init__(self, rag_service: RagService) -> None:
        self.rag_service = rag_service
        self.chat_repo = ChatRepository()
        self.logger = logging.getLogger(__name__)

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

    def set_message_feedback(self, user_id: str, message_id: str, feedback: str | None) -> dict[str, Any]:
        if feedback not in {"like", "dislike", None}:
            raise ValueError("INVALID_FEEDBACK")

        message = self.chat_repo.get_message_for_user(message_id, user_id)
        if message is None:
            raise ValueError("MESSAGE_NOT_FOUND")

        updated = self.chat_repo.set_message_feedback(message_id, user_id, feedback)
        if updated is None:
            raise ValueError("MESSAGE_NOT_FOUND")
        return self._serialize_message(updated)

    def get_feedback_stats(self) -> dict[str, Any]:
        messages = self.chat_repo.list_rated_assistant_messages()
        likes = 0
        dislikes = 0
        signalement_responses = 0
        now = datetime.now(UTC)
        trend_buckets: dict[str, dict[str, Any]] = {}

        for offset in range(6, -1, -1):
            day = (now - timedelta(days=offset)).date()
            trend_buckets[day.isoformat()] = {
                "date": day.isoformat(),
                "label": day.strftime("%d/%m"),
                "likes": 0,
                "dislikes": 0,
                "signalements": 0,
            }

        documents: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "documentId": "",
                "documentName": "Document sans nom",
                "documentType": "",
                "category": "",
                "likes": 0,
                "dislikes": 0,
                "signalements": 0,
                "reportRate": 0.0,
            }
        )
        recent_dislikes: list[dict[str, Any]] = []

        for message in messages:
            feedback = message.feedback
            if feedback == "like":
                likes += 1
            elif feedback == "dislike":
                dislikes += 1

            normalized_sources = [source for source in message.sources if isinstance(source, dict)]
            document_sources = [
                source
                for source in normalized_sources
                if str(source.get("document_id", "")).strip() or str(source.get("document_name", "")).strip()
            ]
            is_document_signalement = feedback == "dislike" and bool(document_sources)

            if is_document_signalement:
                signalement_responses += 1

            feedback_at = message.feedback_at or message.created_at
            day_key = feedback_at.astimezone(UTC).date().isoformat()
            if day_key in trend_buckets:
                if feedback == "like":
                    trend_buckets[day_key]["likes"] += 1
                elif feedback == "dislike":
                    trend_buckets[day_key]["dislikes"] += 1
                    if is_document_signalement:
                        trend_buckets[day_key]["signalements"] += 1

            if feedback == "dislike":
                recent_dislikes.append(
                    {
                        "messageId": message.id or "",
                        "conversationId": message.conversation_id,
                        "content": self._truncate(message.content, 180),
                        "feedbackAt": feedback_at.astimezone(UTC).isoformat(),
                        "isSignalement": is_document_signalement,
                        "sources": [
                            {
                                "documentId": str(source.get("document_id", "")),
                                "documentName": str(source.get("document_name", "Document sans nom")),
                            }
                            for source in document_sources[:4]
                        ],
                    }
                )

            for source in document_sources:
                document_id = str(source.get("document_id", "")).strip()
                document_name = str(source.get("document_name", "")).strip()
                if not document_id and not document_name:
                    continue

                key = document_id or document_name
                item = documents[key]
                item["documentId"] = document_id
                item["documentName"] = document_name or "Document sans nom"
                item["documentType"] = str(source.get("document_type", "")).strip()
                item["category"] = str(source.get("category", "")).strip()
                if feedback == "like":
                    item["likes"] += 1
                elif feedback == "dislike":
                    item["dislikes"] += 1
                    item["signalements"] += 1

        document_items = []
        for item in documents.values():
            total_for_document = int(item["likes"]) + int(item["dislikes"])
            item["reportRate"] = round((int(item["dislikes"]) / total_for_document) * 100, 1) if total_for_document else 0.0
            document_items.append(item)

        document_items.sort(key=lambda item: (int(item["dislikes"]), int(item["likes"])), reverse=True)
        flagged_documents = [item for item in document_items if int(item["signalements"]) > 0]
        total_votes = likes + dislikes
        satisfaction_rate = round((likes / total_votes) * 100) if total_votes else 0
        most_flagged = flagged_documents[0] if flagged_documents else None

        distribution = []
        total_document_signalements = sum(int(item["signalements"]) for item in flagged_documents)
        for item in flagged_documents[:4]:
            count = int(item["signalements"])
            distribution.append(
                {
                    "documentName": item["documentName"],
                    "count": count,
                    "percentage": round((count / total_document_signalements) * 100) if total_document_signalements else 0,
                }
            )
        other_count = sum(int(item["signalements"]) for item in flagged_documents[4:])
        if other_count:
            distribution.append(
                {
                    "documentName": "Autres documents",
                    "count": other_count,
                    "percentage": round((other_count / total_document_signalements) * 100) if total_document_signalements else 0,
                }
            )

        return {
            "summary": {
                "reportedResponses": signalement_responses,
                "dislikesWithoutSource": max(0, dislikes - signalement_responses),
                "documentSignalements": total_document_signalements,
                "likes": likes,
                "dislikes": dislikes,
                "satisfactionRate": satisfaction_rate,
                "mostFlaggedDocument": {
                    "documentId": most_flagged["documentId"],
                    "documentName": most_flagged["documentName"],
                    "signalements": most_flagged["signalements"],
                }
                if most_flagged
                else None,
            },
            "trend": list(trend_buckets.values()),
            "quality": {
                "likes": likes,
                "dislikes": dislikes,
                "signalements": signalement_responses,
                "dislikesWithoutSource": max(0, dislikes - signalement_responses),
                "satisfactionRate": satisfaction_rate,
            },
            "documents": document_items[:10],
            "distribution": distribution,
            "recentDislikes": recent_dislikes[:8],
        }

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
            self.logger.exception("Chat assistant request failed during RAG processing.")
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
                    "legal_status": str(item.get("legal_status", "inconnu")).strip(),
                    "date_publication": item.get("date_publication"),
                    "date_entree_vigueur": item.get("date_entree_vigueur"),
                    "version": str(item.get("version", "")).strip(),
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
    def _truncate(content: str, max_length: int) -> str:
        compact = " ".join(content.split())
        if len(compact) <= max_length:
            return compact
        return f"{compact[: max_length - 3].rstrip()}..."

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
            "feedback": message.feedback,
            "feedbackAt": message.feedback_at.isoformat() if message.feedback_at else None,
        }
