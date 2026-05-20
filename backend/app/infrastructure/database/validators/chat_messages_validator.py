CHAT_MESSAGES_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["conversationId", "role", "content", "createdAt", "status"],
        "properties": {
            "conversationId": {"bsonType": "string", "minLength": 1},
            "role": {"enum": ["user", "assistant", "system"]},
            "content": {"bsonType": "string"},
            "sources": {"bsonType": "array"},
            "feedback": {"enum": ["like", "dislike", None]},
            "feedbackAt": {"bsonType": ["date", "null"]},
            "feedbackUserId": {"bsonType": ["string", "null"]},
            "status": {"enum": ["generating", "completed", "failed"]},
            "createdAt": {"bsonType": "date"},
        },
    }
}
