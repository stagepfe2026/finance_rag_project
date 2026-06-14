import requests
from app.infrastructure.embeddings.base_embedding_provider import BaseEmbeddingProvider


class OllamaEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, base_url: str, model_name: str):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    def embed(self, texts: list[str]) -> list[list[float]]:
        normalized_texts = [text.strip() for text in texts]
        if not normalized_texts or any(not text for text in normalized_texts):
            raise ValueError("Embedding input contains empty chunks.")

        return [self._embed_single_text(text) for text in normalized_texts]

    def _embed_single_text(self, text: str) -> list[float]:
        try:
            response = requests.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model_name, "input": text},
                timeout=300,
            )
            response.raise_for_status()
            data = response.json()
            embeddings = data.get("embeddings", [])
            if embeddings and isinstance(embeddings[0], list):
                return embeddings[0]
        except requests.HTTPError as exc:
            response_text = exc.response.text.strip() if exc.response is not None else ""
            detail = f" Ollama response: {response_text}" if response_text else ""
            raise ValueError(
                f"Unable to generate embeddings with model '{self.model_name}'.{detail}"
            ) from exc
        except Exception as exc:
            raise ValueError(
                f"Unable to generate embeddings with model '{self.model_name}'."
            ) from exc

        raise ValueError(
            f"Ollama returned an unexpected embeddings payload for model '{self.model_name}'."
        )
