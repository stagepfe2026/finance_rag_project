from app.core.config import settings
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

_client: MongoClient | None = None


def connect_to_mongo() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.mongodb_uri)
        _client.admin.command("ping")
    return _client


def get_database() -> Database:
    client = connect_to_mongo()
    return client[settings.mongodb_db_name]


def get_documents_collection() -> Collection:
    database = get_database()
    return database[settings.mongodb_documents_collection]


def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
