DOCUMENTS_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "title",
            "category",
            "status",
            "legalStatus",
            "legalType",
            "filePath",
            "fileSize",
            "fileType",
            "createdAt",
        ],
        "properties": {
            "title": {"bsonType": "string", "minLength": 1},
            "category": {"enum": ["finance", "notes", "conventions", "recueil", "other"]},
            "status": {"enum": ["processing", "indexed", "failed"]},
            "legalStatus": {"enum": ["actif", "futur", "abroge", "remplace"]},
            "legalType": {
                "enum": ["loi", "decret", "arrete", "circulaire", "note", "autre"]
            },
            "issuedAt": {"bsonType": ["date", "null"]},
            "datePublication": {"bsonType": ["date", "null"]},
            "dateEntreeVigueur": {"bsonType": ["date", "null"]},
            "version": {"bsonType": "string"},
            "relationToTarget": {"enum": ["none", "remplace", "abroge"]},
            "targetDocumentId": {"bsonType": ["string", "null"]},
            "filePath": {"bsonType": "string", "minLength": 1},
            "fileSize": {"bsonType": ["int", "long"], "minimum": 0},
            "fileType": {"bsonType": "string"},
            "createdAt": {"bsonType": "date"},
            "deletedAt": {"bsonType": ["date", "null"]},
            "indexedAt": {"bsonType": ["date", "null"]},
            "chunkCount": {"bsonType": ["int", "long", "null"], "minimum": 0},
            "lastIndexError": {"bsonType": ["string", "null"]},
            "extractedText": {"bsonType": ["string", "null"]},
        },
    }
}
