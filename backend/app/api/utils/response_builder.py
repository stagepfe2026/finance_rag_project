from typing import Any


def ok_response(data: Any = None, message: str | None = None) -> dict[str, Any]:
    response: dict[str, Any] = {"success": True}
    if message is not None:
        response["message"] = message
    if data is not None:
        response["data"] = data
    return response


def error_response(message: str, code: str | None = None) -> dict[str, Any]:
    response: dict[str, Any] = {"success": False, "message": message}
    if code is not None:
        response["code"] = code
    return response
