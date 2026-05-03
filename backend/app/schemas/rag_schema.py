from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class RagQueryMode(StrEnum):
    current = "current"
    future_preview = "future_preview"
    comparison = "comparison"


class AskRequest(BaseModel):
    question: str | None = Field(default=None, min_length=3)
    query: str | None = Field(default=None, min_length=3)
    query_mode: RagQueryMode = RagQueryMode.current

    @model_validator(mode="after")
    def normalize_question(self) -> "AskRequest":
        normalized_question = (self.question or self.query or "").strip()
        if len(normalized_question) < 3:
            raise ValueError("question must contain at least 3 characters.")
        self.question = normalized_question
        return self
