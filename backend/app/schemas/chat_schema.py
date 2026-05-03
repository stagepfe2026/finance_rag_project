from typing import Literal

from app.schemas.rag_schema import RagQueryMode
from pydantic import BaseModel, Field, model_validator


class ChatAskRequest(BaseModel):
    content: str | None = Field(default=None, min_length=1)
    query: str | None = Field(default=None, min_length=1)
    conversation_id: str | None = None
    response_mode: Literal["short", "detailed"] = "detailed"
    query_mode: RagQueryMode = RagQueryMode.current

    @model_validator(mode="after")
    def normalize_content(self) -> "ChatAskRequest":
        normalized_content = (self.content or self.query or "").strip()
        if not normalized_content:
            raise ValueError("content must not be empty.")
        self.content = normalized_content
        return self


class ChatConversationRenameRequest(BaseModel):
    summary: str = Field(..., min_length=1, max_length=120)


class ChatMessageFeedbackRequest(BaseModel):
    feedback: Literal["like", "dislike"] | None = None
