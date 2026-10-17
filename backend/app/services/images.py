"""Destination photos from Unsplash."""

import asyncio
import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

SEARCH_URL = "https://api.unsplash.com/search/photos"
UTM = "?utm_source=tripvibe&utm_medium=referral"


class ImageService:
    def __init__(self):
        self.access_key = get_settings().unsplash_access_key
        self._cache: Dict[str, Optional[Dict[str, str]]] = {}

    async def _search(
        self, client: httpx.AsyncClient, query: str
    ) -> Optional[Dict[str, str]]:
        if query in self._cache:
            return self._cache[query]

        photo = None
        try:
            response = await client.get(
                SEARCH_URL,
                params={"query": query, "per_page": 1, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {self.access_key}"},
            )
            response.raise_for_status()
            results = response.json().get("results", [])
            if results:
                first = results[0]
                photo = {
                    "url": first["urls"]["regular"],
                    "credit": first["user"]["name"],
                    "credit_url": first["user"]["links"]["html"] + UTM,
                }
        except Exception as e:
            # Photos are decoration. A failure must never break the itinerary.
            logger.warning("Unsplash search failed for '%s': %s", query, e)
            return None

        self._cache[query] = photo
        return photo

    async def _photo_for_day(
        self, client: httpx.AsyncClient, destination: str, day: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        activities = day.get("activities", [])
        sights = [a for a in activities if a.get("category") != "food"]
        main = (sights or activities or [None])[0]

        queries = []
        if main:
            queries.append(f"{main['title']} {destination}")
        queries.append(destination)

        for query in queries:
            photo = await self._search(client, query)
            if photo:
                return photo
        return None

    async def add_day_images(
        self, destination: str, days: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if not self.access_key:
            return days

        async with httpx.AsyncClient(timeout=10) as client:
            photos = await asyncio.gather(
                *[self._photo_for_day(client, destination, d) for d in days]
            )

        for day, photo in zip(days, photos):
            if photo:
                day["image_url"] = photo["url"]
                day["image_credit"] = photo["credit"]
                day["image_credit_url"] = photo["credit_url"]
        return days


@lru_cache
def get_image_service() -> ImageService:
    return ImageService()