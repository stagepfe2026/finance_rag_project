NOTIFICATIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["userId", "notificationType", "title", "description", "isRead", "createdAt"],
        "properties": {
            "userId": {"bsonType": "string", "minLength": 1},
            "notificationType": {"bsonType": "string", "minLength": 1},
            "title": {"bsonType": "string", "minLength": 1},
            "description": {"bsonType": "string"},
            "link": {"bsonType": ["string", "null"]},
            "isRead": {"bsonType": "bool"},
            "createdAt": {"bsonType": "date"},
            "readAt": {"bsonType": ["date", "null"]},
        },
    }
}
