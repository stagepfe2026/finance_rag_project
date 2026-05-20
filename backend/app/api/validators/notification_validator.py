from fastapi import HTTPException


def normalize_notification_id(notification_id: str) -> str:
    normalized_id = notification_id.strip()
    if not normalized_id:
        raise HTTPException(status_code=400, detail="notification_id est obligatoire.")
    return normalized_id
