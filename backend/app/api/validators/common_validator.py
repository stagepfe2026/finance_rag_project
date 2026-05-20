from datetime import datetime

from fastapi import HTTPException


def parse_optional_iso_datetime(value: str | None, field_name: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} doit etre une date ISO 8601 valide.",
        ) from exc
