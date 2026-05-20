from typing import Any


def normalize_optional_filter(value: str | None) -> str | None:
    normalized_value = (value or "").strip()
    return normalized_value or None


def normalize_audit_filters(
    *,
    user_id: str | None,
    action_type: str | None,
    search: str | None,
) -> dict[str, Any]:
    return {
        "user_id": normalize_optional_filter(user_id),
        "action_type": normalize_optional_filter(action_type),
        "search": normalize_optional_filter(search),
    }
