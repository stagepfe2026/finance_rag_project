# app/infrastructure/generation/ollama_generation_provider.py
import json

import requests


class OllamaGenerationProvider:
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
            return data.get("response", "").strip()
        except json.JSONDecodeError:
            pass

        # Cas 2: plusieurs JSON lignes
        full_response = []
        for line in raw_text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                if "response" in data:
                    full_response.append(data["response"])
            except json.JSONDecodeError:
                continue

        return "".join(full_response).strip()
