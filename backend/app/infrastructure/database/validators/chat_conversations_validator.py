CHAT_CONVERSATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["userId", "title", "createdAt", "updatedAt", "isArchived"],
        "properties": {
            "userId": {"bsonType": "string", "minLength": 1},
            "title": {"bsonType": "string", "minLength": 1, "maxLength": 120},
            "createdAt": {"bsonType": "date"},
            "updatedAt": {"bsonType": "date"},
            "isArchived": {"bsonType": "bool"},
            "archivedAt": {"bsonType": ["date", "null"]},
            "deletedAt": {"bsonType": ["date", "null"]},
        },
    }
}
