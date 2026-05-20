from pymongo.collection import Collection
from pymongo.errors import OperationFailure


def create_partial_unique_string_index(collection: Collection, field_name: str) -> None:
    index_name = f"{field_name}_1"
    try:
        collection.create_index(
            field_name,
            name=index_name,
            unique=True,
            partialFilterExpression={field_name: {"$type": "string"}},
        )
    except OperationFailure as exc:
        if exc.code != 86:
            raise

        collection.drop_index(index_name)
        collection.create_index(
            field_name,
            name=index_name,
            unique=True,
            partialFilterExpression={field_name: {"$type": "string"}},
        )
