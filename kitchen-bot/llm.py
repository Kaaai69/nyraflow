"""Клиент OpenAI-совместимого API (Polza AI, DeepSeek, OpenRouter и т. п.)."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

import httpx

from core import LLMError

log = logging.getLogger(__name__)

RETRY_STATUSES = {408, 409, 429, 500, 502, 503, 504}


def parse_json_object(content: str) -> dict[str, Any]:
    """JSON из ответа модели: терпим обёртку ```json и текст вокруг объекта."""
    text = content.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("в ответе нет JSON-объекта") from None
        data = json.loads(text[start : end + 1])
    if not isinstance(data, dict):
        raise ValueError("ответ — не объект")
    return data


class OpenAICompatLLM:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        *,
        temperature: float | None = None,
        reasoning_effort: str | None = None,
        timeout: float = 60,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.reasoning_effort = reasoning_effort
        self._http = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=timeout,
        )

    async def aclose(self) -> None:
        await self._http.aclose()

    async def complete_json(
        self, messages: list[dict[str, str]], schema: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        # Спецификация: не распарсился JSON — один повтор, дальше пусть ядро переспросит клиента.
        for attempt in range(2):
            content = await self._chat(messages, schema)
            try:
                return parse_json_object(content)
            except ValueError:
                log.warning("не JSON (попытка %d): %r", attempt + 1, content[:300])
        raise LLMError("модель дважды ответила не JSON")

    async def _chat(self, messages: list[dict[str, str]], schema: dict[str, Any] | None) -> str:
        # json_object Claude через Polza соблюдает не всегда — изредка отвечает просто текстом.
        # Строгую схему соблюдает всегда, поэтому если схема есть — передаём её.
        response_format: dict[str, Any] = (
            {"type": "json_schema", "json_schema": {"name": "turn", "strict": True, "schema": schema}}
            if schema
            else {"type": "json_object"}
        )
        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "response_format": response_format,
            "max_tokens": 2000,
        }
        if self.temperature is not None:
            body["temperature"] = self.temperature
        if self.reasoning_effort:
            body["reasoning_effort"] = self.reasoning_effort

        for attempt in range(3):
            try:
                resp = await self._http.post("/chat/completions", json=body)
            except httpx.HTTPError as e:
                log.warning("сеть: %s (попытка %d)", e, attempt + 1)
            else:
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        usage = data.get("usage") or {}
                        log.info(
                            "llm ok: in=%s out=%s cost=%s",
                            usage.get("prompt_tokens"),
                            usage.get("completion_tokens"),
                            usage.get("cost"),
                        )
                        return data["choices"][0]["message"]["content"] or ""
                    except (ValueError, KeyError, IndexError, TypeError) as e:
                        raise LLMError(f"странный ответ API: {resp.text[:300]}") from e
                if resp.status_code not in RETRY_STATUSES:
                    raise LLMError(f"API {resp.status_code}: {resp.text[:300]}")
                log.warning("API %s (попытка %d): %s", resp.status_code, attempt + 1, resp.text[:200])
            await asyncio.sleep(1.5 * (attempt + 1))
        raise LLMError("API не ответил после трёх попыток")
