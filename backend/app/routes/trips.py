"""Trip and itinerary routes."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, status

from app.prompts.templates import build_itinerary_prompt, build_recommend_prompt
from app.schemas.schemas import (
    CreateTripRequest,
    RecommendRequest,
    RecommendResponse,
    RegenerateRequest,
    TripDetailResponse,
    TripResponse,
)
from app.services.ai import get_ai_orchestrator
from app.services.history import get_history_service
from app.services.images import get_image_service
from app.services.trip import (
    get_itinerary_service,
    get_trip_service,
    itinerary_to_response,
)
from app.utils.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trips", tags=["Trips"])


def _prompt_from_trip(
    trip: dict,
    feedback: Optional[str] = None,
    previous_summary: Optional[str] = None,
) -> str:
    """Build the AI prompt from trip details (works for a request or a database row)."""
    return build_itinerary_prompt(
        destination=trip["destination"],
        start_date=str(trip["start_date"]),
        end_date=str(trip["end_date"]),
        travel_style=trip.get("travel_style") or "cultural",
        interests=trip.get("interests") or [],
        group_size=trip.get("group_size") or 1,
        pace=trip.get("pace") or "moderate",
        budget_per_day=float(trip.get("budget_per_day") or 3000),
        dietary_restrictions=trip.get("dietary_restrictions"),
        mobility_concerns=trip.get("mobility_concerns"),
        feedback=feedback,
        previous_summary=previous_summary,
    )


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_destinations(
    data: RecommendRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Activity 3.3: suggest destinations for someone who doesn't know where to go."""
    prompt = build_recommend_prompt(
        data.travel_style,
        data.interests,
        data.budget_per_day,
        data.duration_days,
        data.group_size,
    )
    result = await get_ai_orchestrator().recommend_destinations(prompt)
    get_history_service().log(
        user_id, "destinations_recommended", {"style": data.travel_style}
    )
    return result


@router.post("", response_model=TripDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    data: CreateTripRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a trip and generate its first itinerary."""
    # Generate first and save after, so a failed AI call leaves no empty trip behind.
    prompt = _prompt_from_trip(data.model_dump(mode="json"))
    content = await get_ai_orchestrator().generate_itinerary(prompt)
    content["days"] = await get_image_service().add_day_images(
        data.destination.strip(), content["days"]
    )

    trip = get_trip_service().create_trip(user_id, data)
    itinerary = get_itinerary_service().save(trip["id"], user_id, content)

    get_history_service().log(
        user_id,
        "trip_created",
        {"trip_id": trip["id"], "destination": trip["destination"]},
    )
    return TripDetailResponse(
        trip=TripResponse(**trip),
        itinerary=itinerary_to_response(itinerary),
    )


@router.get("", response_model=List[TripResponse])
async def list_trips(user_id: str = Depends(get_current_user_id)):
    """All trips that belong to the logged-in user."""
    return get_trip_service().list_trips(user_id)


@router.get("/{trip_id}", response_model=TripDetailResponse)
async def get_trip(trip_id: str, user_id: str = Depends(get_current_user_id)):
    """One trip plus its latest itinerary."""
    trip = get_trip_service().get_trip(trip_id, user_id)
    latest = get_itinerary_service().get_latest(trip["id"], user_id)
    return TripDetailResponse(
        trip=TripResponse(**trip),
        itinerary=itinerary_to_response(latest) if latest else None,
    )


@router.post("/{trip_id}/regenerate", response_model=TripDetailResponse)
async def regenerate_itinerary(
    trip_id: str,
    data: RegenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Activity 4.3: generate a new version using the user's feedback or a new vibe."""
    trips = get_trip_service()
    itineraries = get_itinerary_service()

    trip = trips.get_trip(trip_id, user_id)

    changes = {}
    if data.travel_style:
        changes["travel_style"] = data.travel_style
    if data.pace:
        changes["pace"] = data.pace
    if changes:
        trip = trips.update_trip(trip["id"], user_id, changes)

    previous = itineraries.get_latest(trip["id"], user_id)
    previous_summary = (
        (previous.get("content") or {}).get("summary") if previous else None
    )

    prompt = _prompt_from_trip(
        trip, feedback=data.feedback, previous_summary=previous_summary
    )
    content = await get_ai_orchestrator().generate_itinerary(prompt)
    content["days"] = await get_image_service().add_day_images(
        trip["destination"], content["days"]
    )
    itinerary = itineraries.save(
        trip["id"], user_id, content, feedback=data.feedback
    )

    get_history_service().log(
        user_id,
        "itinerary_regenerated",
        {"trip_id": trip["id"], "version": itinerary["version"]},
    )
    return TripDetailResponse(
        trip=TripResponse(**trip),
        itinerary=itinerary_to_response(itinerary),
    )


@router.delete("/{trip_id}")
async def delete_trip(trip_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a trip and all of its itineraries."""
    get_trip_service().delete_trip(trip_id, user_id)
    get_history_service().log(user_id, "trip_deleted", {"trip_id": trip_id})
    return {"message": "Trip deleted"}