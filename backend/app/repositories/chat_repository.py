from datetime import UTC, datetime

from bson import ObjectId

from app.core.database import get_chat_conversations_collection, get_chat_messages_collection
from app.models.chat_model import ChatMessageModel, ConversationModel


class ChatRepository:
    def __init__(self) -> None:
        self.conversations = get_chat_conversations_collection()
        self.messages = get_chat_messages_collection()

    def ensure_indexes(self) -> None:
        self.conversations.create_index([("userId", 1), ("updatedAt", -1)])
        self.messages.create_index([("conversationId", 1), ("createdAt", 1)])
        self.messages.create_index([("role", 1), ("feedback", 1), ("feedbackAt", -1)])

    def create_conversation(self, conversation: ConversationModel) -> ConversationModel:
        result = self.conversations.insert_one(conversation.to_mongo_insert())
        conversation.id = str(result.inserted_id)
        return conversation

    def list_conversations_for_user(self, user_id: str) -> list[ConversationModel]:
        cursor = self.conversations.find({"userId": user_id, "deletedAt": None}).sort("updatedAt", -1)
        return [ConversationModel.from_mongo(raw) for raw in cursor]

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

    def update_conversation_after_message(self, conversation_id: str, summary: str | None = None) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        update_fields: dict[str, object] = {"updatedAt": datetime.now(UTC)}
        if summary is not None:
            update_fields["summary"] = summary
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": update_fields},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    def rename_conversation(self, conversation_id: str, summary: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"summary": summary, "updatedAt": datetime.now(UTC)}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    def archive_conversation(self, conversation_id: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.now(UTC)
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"isArchived": True, "archivedAt": now, "updatedAt": now}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    def restore_conversation(self, conversation_id: str) -> ConversationModel | None:
        if not ObjectId.is_valid(conversation_id):
            return None
        now = datetime.now(UTC)
        self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"isArchived": False, "updatedAt": now}, "$unset": {"archivedAt": ""}},
        )
        raw = self.conversations.find_one({"_id": ObjectId(conversation_id), "deletedAt": None})
        return ConversationModel.from_mongo(raw) if raw else None

    def delete_conversation(self, conversation_id: str) -> bool:
        if not ObjectId.is_valid(conversation_id):
            return False
        result = self.conversations.update_one(
            {"_id": ObjectId(conversation_id), "deletedAt": None},
            {"$set": {"deletedAt": datetime.now(UTC), "updatedAt": datetime.now(UTC)}},
        )
        return result.modified_count > 0

    def create_message(self, message: ChatMessageModel) -> ChatMessageModel:
        result = self.messages.insert_one(message.to_mongo_insert())
        message.id = str(result.inserted_id)
        return message

    def list_messages_for_conversation(self, conversation_id: str) -> list[ChatMessageModel]:
        cursor = self.messages.find({"conversationId": conversation_id}).sort("createdAt", 1)
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]

    def get_message_for_user(self, message_id: str, user_id: str) -> ChatMessageModel | None:
        if not ObjectId.is_valid(message_id):
            return None
        raw = self.messages.find_one({"_id": ObjectId(message_id), "role": "assistant"})
        if raw is None:
            return None

        conversation = self.get_conversation_for_user(str(raw.get("conversationId", "")), user_id)
        if conversation is None:
            return None
        return ChatMessageModel.from_mongo(raw)

    def set_message_feedback(
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

    def list_rated_assistant_messages(self) -> list[ChatMessageModel]:
        cursor = self.messages.find({"role": "assistant", "feedback": {"$in": ["like", "dislike"]}}).sort(
            "feedbackAt",
            -1,
        )
        return [ChatMessageModel.from_mongo(raw) for raw in cursor]
