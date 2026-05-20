from abc import ABC, abstractmethod


class BaseGenerationProvider(ABC):
    @abstractmethod
    def generate(
        self,
        prompt: str,
        temperature: float,
        top_k: int,
        top_p: float,
        max_new_tokens: int,
        repetition_penalty: float,
        context_window: int,
    ) -> str:
        raise NotImplementedError
