from datetime import UTC, datetime

from app.core.database import get_chat_conversations_collection, get_chat_messages_collection
from app.models.chat_model import ChatMessageModel, ConversationModel
from bson import ObjectId


class ChatRepository:
    def __init__(self) -> None:
        self.conversations = get_chat_conversations_collection()
        self.messages = get_chat_messages_collection()

    # Crée les index MongoDB nécessaires pour accélérer les requêtes de conversations et messages.
    def ensure_indexes(self) -> None:
        self.conversations.create_index([("userId", 1), ("updatedAt", -1)])
        self.messages.create_index([("conversationId", 1), ("createdAt", 1)])
        self.messages.create_index([("role", 1), ("feedback", 1), ("feedbackAt", -1)])

    # Insère une nouvelle conversation en base et retourne l'objet avec son id généré.
    def create(self, conversation: ConversationModel) -> ConversationModel:
        result = self.conversations.insert_one(conversation.to_mongo_insert())
        conversation.id = str(result.inserted_id)
        return conversation

    # Retourne toutes les conversations actives d'un utilisateur, triées par date de modification.
    def list_for_user(self, user_id: str) -> list[ConversationModel]:
        cursor = self.conversations.find({"userId": user_id, "deletedAt": None}).sort("updatedAt", -1)
        return [ConversationModel.from_mongo(raw) for raw in cursor]

    # Retourne les conversations les plus récentes de tous les utilisateurs (usage admin).
    def list_recent(self, *, limit: int = 250) -> list[ConversationModel]:
        cursor = self.conversations.find({}).sort("updatedAt", -1).limit(limit)
        return [ConversationModel.from_mongo(raw) for raw in cursor]

    # Retourne les messages les plus récents toutes conversations confondues (usage admin).
    def list_recent_messages(self, *, limit: int = 250) -> list[ChatMessageModel]:
        cursor = self.messages.find({}).sort("createdAt", -1).limit(limit)
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]

    # Récupère une conversation précise en vérifiant qu'elle appartient bien à l'utilisateur.
    def get_conversation_for_user(self, conversation_id: str, user_id: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        raw = self.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "userId": user_id,
            "deletedAt": None,
        })
        if raw is None:
            return None
        return ConversationModel.from_mongo(raw)

    # Met à jour le timestamp (et optionnellement le titre) d'une conversation après un nouveau message.
    def refresh_after_message(self, conversation_id: str, title: str | None = None) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        update_fields: dict[str, object] = {"updatedAt": datetime.now(UTC)}
        if title is not None:
            update_fields["title"] = title
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": update_fields},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    # Renomme le titre d'une conversation existante.
    def rename(self, conversation_id: str, title: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"title": title, "updatedAt": datetime.now(UTC)}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    # Archive une conversation sans la supprimer, en posant un flag isArchived.
    def archive(self, conversation_id: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.now(UTC)
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"isArchived": True, "archivedAt": now, "updatedAt": now}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    # Restaure une conversation archivée en retirant le flag isArchived.
    def restore(self, conversation_id: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.now(UTC)
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"isArchived": False, "updatedAt": now}, "$unset": {"archivedAt": ""}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    # Supprime logiquement une conversation et efface physiquement tous ses messages.
    def delete(self, conversation_id: str) -> bool:
        if not ObjectId.is_valid(conversation_id):
            return False
        result = self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"deletedAt": datetime.now(UTC), "updatedAt": datetime.now(UTC)}},
        )
        if result.modified_count > 0:
            self.messages.delete_many({"conversationId": conversation_id})
        return result.modified_count > 0

    # Insère un nouveau message en base et retourne l'objet avec son id généré.
    def save(self, message: ChatMessageModel) -> ChatMessageModel:
        result = self.messages.insert_one(message.to_mongo_insert())
        message.id = str(result.inserted_id)
        return message

    # Retourne tous les messages d'une conversation, triés par ordre chronologique.
    def list_for_conversation(self, conversation_id: str) -> list[ChatMessageModel]:
        cursor = self.messages.find({"conversationId": conversation_id}).sort("createdAt", 1)
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]

    # Récupère un message assistant en vérifiant que la conversation appartient à l'utilisateur.
    def get_for_user(self, message_id: str, user_id: str) -> ChatMessageModel | None:
        if not ObjectId.is_valid(message_id):
            return None
        raw = self.messages.find_one({"_id": ObjectId(message_id), "role": "assistant"})
        if raw is None:
            return None

        conversation = self.get_conversation_for_user(str(raw.get("conversationId", "")), user_id)
        if conversation is None:
            return None
        return ChatMessageModel.from_mongo(raw)

    # Enregistre ou retire le feedback (like/dislike) d'un utilisateur sur un message assistant.
    def save_feedback(
        self,
        message_id: str,
        user_id: str,
        feedback: str | None,
    ) -> ChatMessageModel | None:
        if not ObjectId.is_valid(message_id):
            return None

        now = datetime.now(UTC)
        update: dict[str, dict[str, object] | dict[str, str]] = {}
        if feedback:
            update["$set"] = {
                "feedback": feedback,
                "feedbackAt": now,
                "feedbackUserId": user_id,
            }
        else:
            update["$unset"] = {
                "feedback": "",
                "feedbackAt": "",
                "feedbackUserId": "",
            }

        self.messages.update_one({"_id": ObjectId(message_id), "role": "assistant"}, update)
        raw = self.messages.find_one({"_id": ObjectId(message_id), "role": "assistant"})
        return ChatMessageModel.from_mongo(raw) if raw else None

    # Met à jour le contenu, les sources et le statut d'un message après génération complète.
    def update_content(
        self,
        message_id: str,
        *,
        content: str,
        sources: list[dict],
        status: str,
    ) -> ChatMessageModel | None:
        if not ObjectId.is_valid(message_id):
            return None
        self.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"content": content, "sources": sources, "status": status}},
        )
        raw = self.messages.find_one({"_id": ObjectId(message_id)})
        return ChatMessageModel.from_mongo(raw) if raw else None

    # Retourne les messages assistant encore en cours de génération pour un utilisateur donné.
    def list_in_progress_for_user(self, user_id: str) -> list[ChatMessageModel]:
        conv_ids = [
            str(doc["_id"])
            for doc in self.conversations.find(
                {"userId": user_id, "deletedAt": None}, {"_id": 1}
            )
        ]
        if not conv_ids:
            return []
        cursor = self.messages.find(
            {"conversationId": {"$in": conv_ids}, "role": "assistant", "status": "generating"}
        )
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]

    # Retourne tous les messages ayant reçu un feedback like ou dislike, triés du plus récent.
    def list_with_feedback(self) -> list[ChatMessageModel]:
        cursor = self.messages.find({"role": "assistant", "feedback": {"$in": ["like", "dislike"]}}).sort(
            "feedbackAt",
            -1,
        )
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]

    # Retourne le dernier échange complété (user + assistant) pour injecter le contexte dans le prompt RAG.
    def list_last_completed_exchange(self, conversation_id: str) -> tuple[ChatMessageModel | None, ChatMessageModel | None]:
        """Return the last completed (user, assistant) message pair for a conversation.

        Used to inject conversation context into the RAG prompt for follow-up questions.
        Returns (None, None) if no completed exchange exists yet.
        """
        cursor = self.messages.find(
            {
                "conversationId": conversation_id,
                "status": "completed",
                "role": {"$in": ["user", "assistant"]},
            }
        ).sort("createdAt", -1).limit(10)

        messages = [ChatMessageModel.from_mongo(raw) for raw in cursor]

        last_user: ChatMessageModel | None = None
        last_assistant: ChatMessageModel | None = None

        for msg in messages:
            if last_assistant is None and msg.role == "assistant" and msg.content.strip():
                last_assistant = msg
            elif last_user is None and msg.role == "user" and last_assistant is not None:
                last_user = msg
                break

        return last_user, last_assistant
