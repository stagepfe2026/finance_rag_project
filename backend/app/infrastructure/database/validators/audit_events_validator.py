AUDIT_EVENTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "occurredAt",
            "userId",
            "actionType",
            "actionLabel",
            "category",
            "entityType",
            "summary",
            "metadata",
        ],
        "properties": {
            "occurredAt": {"bsonType": "date"},
            "userId": {"bsonType": "string"},
            "actionType": {"bsonType": "string", "minLength": 1},
            "actionLabel": {"bsonType": "string"},
            "category": {"bsonType": "string"},
            "entityType": {"bsonType": "string"},
            "entityId": {"bsonType": "string"},
            "entityLabel": {"bsonType": "string"},
            "summary": {"bsonType": "string"},
            "metadata": {"bsonType": "object"},
        },
    }
}
