"""Database operations for trips and itineraries."""

import logging
from functools import lru_cache
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.schemas.schemas import CreateTripRequest, ItineraryResponse
from app.utils.db import get_supabase
from app.utils.errors import NotFoundError

logger = logging.getLogger(__name__)


def _check_uuid(value: str) -> str:
    """A malformed ID should give a clean 404, not a database crash."""
    try:
        return str(UUID(value))
    except ValueError:
        raise NotFoundError("Trip not found")


class TripService:
    def __init__(self):
        self.db = get_supabase()

    def create_trip(self, user_id: str, data: CreateTripRequest) -> Dict[str, Any]:
        row = {
            "user_id": user_id,
            "title": data.title or f"Trip to {data.destination.strip()}",
            "destination": data.destination.strip(),
            "start_date": data.start_date.isoformat(),
            "end_date": data.end_date.isoformat(),
            "travel_style": data.travel_style,
            "interests": data.interests,
            "group_size": data.group_size,
            "pace": data.pace,
            "budget_per_day": data.budget_per_day,
            "dietary_restrictions": data.dietary_restrictions,
            "mobility_concerns": data.mobility_concerns,
        }
        result = self.db.table("trips").insert(row).execute()
        return result.data[0]

    def list_trips(self, user_id: str) -> List[Dict[str, Any]]:
        result = (
            self.db.table("trips")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    def get_trip(self, trip_id: str, user_id: str) -> Dict[str, Any]:
        trip_id = _check_uuid(trip_id)
        result = (
            self.db.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not result.data:
            raise NotFoundError("Trip not found")
        return result.data[0]

    def update_trip(self, trip_id: str, user_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        self.get_trip(trip_id, user_id)  # makes sure it exists and is theirs
        result = (
            self.db.table("trips")
            .update(changes)
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]

    def delete_trip(self, trip_id: str, user_id: str) -> None:
        self.get_trip(trip_id, user_id)
        self.db.table("trips").delete().eq("id", trip_id).eq("user_id", user_id).execute()


class ItineraryService:
    def __init__(self):
        self.db = get_supabase()

    def get_latest(self, trip_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        result = (
            self.db.table("itineraries")
            .select("*")
            .eq("trip_id", trip_id)
            .eq("user_id", user_id)
            .order("version", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def save(
        self,
        trip_id: str,
        user_id: str,
        content: Dict[str, Any],
        feedback: Optional[str] = None,
    ) -> Dict[str, Any]:
        latest = self.get_latest(trip_id, user_id)
        version = (latest["version"] + 1) if latest else 1

        row = {
            "trip_id": trip_id,
            "user_id": user_id,
            "content": content,
            "version": version,
            "feedback": feedback,
        }
        result = self.db.table("itineraries").insert(row).execute()
        return result.data[0]


def itinerary_to_response(row: Dict[str, Any]) -> ItineraryResponse:
    """Turn a database row into the shape the API returns."""
    content = row.get("content") or {}
    return ItineraryResponse(
        id=row["id"],
        trip_id=row["trip_id"],
        version=row["version"],
        summary=content.get("summary"),
        days=content.get("days", []),
        created_at=row.get("created_at"),
    )


@lru_cache
def get_trip_service() -> TripService:
    return TripService()


@lru_cache
def get_itinerary_service() -> ItineraryService:
    return ItineraryService()