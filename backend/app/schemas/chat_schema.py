from typing import Literal

from pydantic import BaseModel, Field


class ChatAskRequest(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: str | None = None
    response_mode: Literal["short", "detailed"] = "detailed"


class ChatConversationRenameRequest(BaseModel):
    summary: str = Field(..., min_length=1, max_length=120)


class ChatMessageFeedbackRequest(BaseModel):
    feedback: Literal["like", "dislike"] | None = None
