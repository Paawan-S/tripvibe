"""Pydantic schemas for request/response validation."""

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ---------- What the user sends ----------

class CreateTripRequest(BaseModel):
    title: Optional[str] = None
    destination: str = Field(..., min_length=2)
    start_date: date
    end_date: date
    travel_style: str = "cultural"
    interests: List[str] = []
    group_size: int = Field(1, ge=1, le=20)
    pace: Literal["relaxed", "moderate", "fast"] = "moderate"
    budget_per_day: float = Field(..., gt=0)
    dietary_restrictions: Optional[List[str]] = None
    mobility_concerns: Optional[str] = None

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (self.end_date - self.start_date).days > 9:
            raise ValueError("Trips can be at most 10 days")
        return self


class RegenerateRequest(BaseModel):
    feedback: Optional[str] = None
    travel_style: Optional[str] = None
    pace: Optional[Literal["relaxed", "moderate", "fast"]] = None


class RecommendRequest(BaseModel):
    travel_style: str = "cultural"
    interests: List[str] = []
    budget_per_day: float = Field(..., gt=0)
    duration_days: int = Field(3, ge=1, le=10)
    group_size: int = Field(1, ge=1, le=20)


# ---------- What the API returns ----------

class TripResponse(BaseModel):
    id: str
    title: str
    destination: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travel_style: Optional[str] = None
    interests: Optional[List[str]] = None
    group_size: Optional[int] = None
    pace: Optional[str] = None
    budget_per_day: Optional[float] = None
    dietary_restrictions: Optional[List[str]] = None
    mobility_concerns: Optional[str] = None
    created_at: Optional[datetime] = None


class Activity(BaseModel):
    time_slot: str
    start_time: str
    title: str
    description: str
    area: str
    category: str = "sightseeing"
    duration_minutes: int = 60
    estimated_cost: float = 0
    travel_time_minutes: int = 0
    image_url: Optional[str] = None


class DayItinerary(BaseModel):
    day: int
    date: Optional[str] = None
    theme: str
    activities: List[Activity]
    estimated_day_cost: float = 0
    image_url: Optional[str] = None
    image_credit: Optional[str] = None
    image_credit_url: Optional[str] = None


class ItineraryResponse(BaseModel):
    id: str
    trip_id: str
    version: int
    summary: Optional[str] = None
    days: List[DayItinerary]
    created_at: Optional[datetime] = None


class TripDetailResponse(BaseModel):
    trip: TripResponse
    itinerary: Optional[ItineraryResponse] = None


class DestinationSuggestion(BaseModel):
    name: str
    country: str
    why: str
    best_for: List[str] = []
    estimated_budget_per_day: float = 0


class RecommendResponse(BaseModel):
    destinations: List[DestinationSuggestion]

class UpdateTripRequest(BaseModel):
    """Every field is optional: the user sends only what they want to change."""

    title: Optional[str] = Field(None, max_length=120)
    destination: Optional[str] = Field(None, min_length=2, max_length=120)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travel_style: Optional[str] = None
    interests: Optional[List[str]] = None
    group_size: Optional[int] = Field(None, ge=1, le=20)
    pace: Optional[Literal["relaxed", "moderate", "fast"]] = None
    budget_per_day: Optional[float] = Field(None, gt=0)
    dietary_restrictions: Optional[List[str]] = None
    mobility_concerns: Optional[str] = None