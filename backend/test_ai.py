import asyncio
import json
import logging

from app.prompts.templates import build_itinerary_prompt
from app.services.ai import get_ai_orchestrator

logging.basicConfig(level=logging.INFO)


async def main():
    prompt = build_itinerary_prompt(
        destination="Goa",
        start_date="2026-11-10",
        end_date="2026-11-12",
        travel_style="relaxed",
        interests=["beaches", "food"],
        group_size=2,
        pace="relaxed",
        budget_per_day=3000,
        dietary_restrictions=["vegetarian"],
    )
    result = await get_ai_orchestrator().generate_itinerary(prompt)
    print(json.dumps(result, indent=2))


asyncio.run(main())