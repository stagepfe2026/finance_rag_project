import json
import logging

import requests
from app.infrastructure.generation.base_generation_provider import BaseGenerationProvider

logger = logging.getLogger(__name__)


class OllamaGenerationProvider(BaseGenerationProvider):
    def __init__(self, base_url: str, model_name: str):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

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
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_k": top_k,
                "top_p": top_p,
                "num_predict": max_new_tokens,
                "repeat_penalty": repetition_penalty,
                "num_ctx": context_window,
            },
        }

        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()

        raw_text = response.text.strip()

        # Cas 1: JSON unique
        try:
            data = json.loads(raw_text)
            generated_text = data.get("response", "").strip()
            self._log_generation_stats(data, max_new_tokens, context_window)
            return generated_text
        except json.JSONDecodeError:
            pass

        # Cas 2: plusieurs JSON lignes (réponse NDJSON)
        full_response: list[str] = []
        last_data: dict = {}
        for line in raw_text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                if "response" in data:
                    full_response.append(data["response"])
                last_data = data
            except json.JSONDecodeError:
                continue

        self._log_generation_stats(last_data, max_new_tokens, context_window)
        return "".join(full_response).strip()

    @staticmethod
    def _log_generation_stats(data: dict, max_new_tokens: int, context_window: int) -> None:
        prompt_tokens = data.get("prompt_eval_count", -1)
        generated_tokens = data.get("eval_count", -1)
        done_reason = data.get("done_reason", "unknown")

        logger.info(
            "Ollama generation: prompt_tokens=%d generated_tokens=%d "
            "done_reason=%s num_predict=%d num_ctx=%d",
            prompt_tokens,
            generated_tokens,
            done_reason,
            max_new_tokens,
            context_window,
        )

        if done_reason == "length":
            logger.warning(
                "Ollama TRUNCATED the response at num_predict=%d tokens "
                "(generated_tokens=%d). Response is incomplete. "
                "Increase MAX_NEW_TOKENS in .env to avoid truncation.",
                max_new_tokens,
                generated_tokens,
            )
