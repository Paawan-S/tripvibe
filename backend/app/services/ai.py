"""AI model integration services."""

import json
import logging
import re
from abc import ABC, abstractmethod
from functools import lru_cache
from typing import Any, Callable, Dict

from pydantic import ValidationError as PydanticValidationError

from app.config import get_settings
from app.prompts.templates import RECOMMEND_SYSTEM_PROMPT, SYSTEM_PROMPT
from app.schemas.schemas import DayItinerary, DestinationSuggestion
from app.utils.errors import AIGenerationError

logger = logging.getLogger(__name__)


# ---------- 1. The provider: talks to the AI company ----------

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        """Send a prompt to the AI and return its text reply."""


class GroqProvider(LLMProvider):
    """Groq API provider."""

    def __init__(self, api_key: str, model: str):
        try:
            from groq import AsyncGroq

            self.client = AsyncGroq(api_key=api_key)
            self.model = model
            logger.info("Groq client ready, model: %s", model)
        except Exception as e:
            raise AIGenerationError(f"Groq initialization failed: {e}")

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.6,
                    max_tokens=8000,
                    response_format={"type": "json_object"},
                )
            except Exception as e:
                # If JSON mode is the problem, retry once without it
                if "json" not in str(e).lower() and "response_format" not in str(e):
                    raise
                logger.warning("JSON mode failed (%s), retrying without it", e)
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.6,
                    max_tokens=8000,
                )
        except Exception as e:
            logger.error("Groq request failed: %s", e)
            raise AIGenerationError(f"Groq request failed: {e}")

        content = response.choices[0].message.content
        if not content:
            raise AIGenerationError("Groq returned an empty reply")
        return content


# ---------- 2. Helpers: clean and check the AI's reply ----------

def extract_json(text: str) -> Dict[str, Any]:
    """Pull a JSON object out of the AI's reply, even if it added extra text."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    raise AIGenerationError("The AI reply was not valid JSON")


def check_itinerary(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the itinerary shape, then sort activities and recompute costs."""
    days_raw = data.get("days")
    if not isinstance(days_raw, list) or not days_raw:
        raise AIGenerationError("The AI reply contained no days")

    try:
        days = [DayItinerary(**d) for d in days_raw]
    except (PydanticValidationError, TypeError) as e:
        raise AIGenerationError(f"The AI reply had the wrong shape: {e}")

    for day in days:
        day.activities.sort(key=lambda a: a.start_time)
        day.estimated_day_cost = sum(a.estimated_cost for a in day.activities)

    return {
        "summary": data.get("summary"),
        "days": [d.model_dump() for d in days],
    }


def check_recommendations(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the list of suggested destinations."""
    raw = data.get("destinations")
    if not isinstance(raw, list) or not raw:
        raise AIGenerationError("The AI reply contained no destinations")

    try:
        items = [DestinationSuggestion(**d) for d in raw]
    except (PydanticValidationError, TypeError) as e:
        raise AIGenerationError(f"The AI reply had the wrong shape: {e}")

    return {"destinations": [i.model_dump() for i in items]}


# ---------- 3. The orchestrator: the one object the routes will use ----------

class AIOrchestrator:
    """Connects the prompts, the AI provider and the validation."""

    MAX_ATTEMPTS = 2

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def _ask(
        self,
        system_prompt: str,
        user_prompt: str,
        check: Callable[[Dict[str, Any]], Dict[str, Any]],
    ) -> Dict[str, Any]:
        last_error = None
        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            raw = await self.provider.generate(system_prompt, user_prompt)
            try:
                return check(extract_json(raw))
            except AIGenerationError as e:
                last_error = e
                logger.warning("Attempt %d/%d failed: %s", attempt, self.MAX_ATTEMPTS, e)
        raise last_error

    async def generate_itinerary(self, user_prompt: str) -> Dict[str, Any]:
        return await self._ask(SYSTEM_PROMPT, user_prompt, check_itinerary)

    async def recommend_destinations(self, user_prompt: str) -> Dict[str, Any]:
        return await self._ask(RECOMMEND_SYSTEM_PROMPT, user_prompt, check_recommendations)


@lru_cache
def get_ai_orchestrator() -> AIOrchestrator:
    settings = get_settings()

    if settings.ai_provider.lower() != "groq":
        raise AIGenerationError(f"Unsupported AI_PROVIDER: {settings.ai_provider}")
    if not settings.groq_api_key:
        raise AIGenerationError("GROQ_API_KEY is missing from .env")

    return AIOrchestrator(GroqProvider(settings.groq_api_key, settings.groq_model))