AUTH_SESSIONS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "userId",
            "hashedToken",
            "csrfToken",
            "expiresAt",
            "refreshExpiresAt",
            "idleExpiresAt",
            "absoluteExpiresAt",
            "createdAt",
            "lastActivityAt",
            "authMethod",
        ],
        "properties": {
            "userId": {"bsonType": "string", "minLength": 1},
            "hashedToken": {"bsonType": "string", "minLength": 1},
            "csrfToken": {"bsonType": "string", "minLength": 1},
            "expiresAt": {"bsonType": "date"},
            "refreshExpiresAt": {"bsonType": "date"},
            "idleExpiresAt": {"bsonType": "date"},
            "absoluteExpiresAt": {"bsonType": "date"},
            "createdAt": {"bsonType": "date"},
            "lastActivityAt": {"bsonType": "date"},
            "authMethod": {"enum": ["local"]},
            "closedAt": {"bsonType": ["date", "null"]},
            "closureReason": {"bsonType": ["string", "null"]},
            "isEarlyClosure": {"bsonType": ["bool", "null"]},
        },
    }
}
