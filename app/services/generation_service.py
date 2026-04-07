# app/services/generation_service.py
from app.infrastructure.generation.ollama_generation_provider import (
    OllamaGenerationProvider,
)


class GenerationService:
    def __init__(self, provider: OllamaGenerationProvider):
        self.provider = provider

    def generate_answer(
        self,
        prompt: str,
        temperature: float,
        top_k: int,
        top_p: float,
        max_new_tokens: int,
        repetition_penalty: float,
        context_window: int,
    ) -> str:
        return self.provider.generate(
            prompt=prompt,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            max_new_tokens=max_new_tokens,
            repetition_penalty=repetition_penalty,
            context_window=context_window,
        )
