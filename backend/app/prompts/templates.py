"""Prompt templates: the instructions we send to the AI."""

from datetime import date
from typing import List, Optional

SYSTEM_PROMPT = """You are TripVibe, an expert travel planner with deep local knowledge.
You create realistic, well-paced, day-by-day itineraries.

RULES
1. Reply with ONE valid JSON object and nothing else. No markdown, no code fences, no commentary.
2. Only suggest real, well-known places that actually exist in the destination.
3. Group places that are close together on the same day and order the activities as a sensible route, so the traveler does not backtrack.
4. time_slot must be one of: morning, afternoon, evening. start_time uses 24-hour format "HH:MM".
5. All costs are in INR, per person. Keep each day's estimated_day_cost within the daily budget.
6. travel_time_minutes is the travel time from the previous activity (use 0 for the first activity of the day).
7. Respect dietary restrictions in every food suggestion and mobility concerns in every activity.
8. Follow the pace and number of activities per day given in the request.

JSON FORMAT
{
  "summary": "2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "short theme for the day",
      "activities": [
        {
          "time_slot": "morning",
          "start_time": "09:00",
          "title": "Name of the place or activity",
          "description": "1-2 sentences on what to do and why it fits the traveler",
          "area": "Neighbourhood or district",
          "category": "one of: sightseeing, food, adventure, culture, shopping, nature, relaxation, nightlife",
          "duration_minutes": 90,
          "estimated_cost": 500,
          "travel_time_minutes": 15
        }
      ],
      "estimated_day_cost": 2500
    }
  ]
}
"""

VIBE_GUIDES = {
    "cultural": "Focus on history, museums, heritage sites, local traditions and authentic local food.",
    "relaxed": "Focus on calm, low-stress experiences: scenic spots, cafes, spas and unhurried meals.",
    "adventure": "Focus on active and outdoor experiences: trekking, water sports and thrilling activities.",
    "luxury": "Focus on premium experiences: fine dining, upscale venues and private or exclusive activities.",
    "budget": "Focus on free or low-cost attractions, street food and affordable local transport.",
    "romantic": "Focus on intimate, scenic experiences: sunset spots, candlelit dinners and quiet walks.",
    "foodie": "Focus on local cuisine: famous restaurants, street food, markets and cooking experiences.",
}

PACE_GUIDES = {
    "relaxed": "2 to 3 activities per day, late starts, long breaks and plenty of rest.",
    "moderate": "3 to 4 activities per day with some downtime.",
    "fast": "4 to 5 activities per day, constantly exploring.",
}


def build_itinerary_prompt(
    destination: str,
    start_date: str,
    end_date: str,
    travel_style: str,
    interests: List[str],
    group_size: int,
    pace: str,
    budget_per_day: float,
    dietary_restrictions: Optional[List[str]] = None,
    mobility_concerns: Optional[str] = None,
    feedback: Optional[str] = None,
    previous_summary: Optional[str] = None,
) -> str:
    """Turn the user's preferences into one clear request for the AI."""
    start = date.fromisoformat(str(start_date))
    end = date.fromisoformat(str(end_date))
    num_days = (end - start).days + 1

    vibe_text = VIBE_GUIDES.get(travel_style.lower(), f"Match the traveler's {travel_style} style.")
    pace_text = PACE_GUIDES.get(pace, PACE_GUIDES["moderate"])
    interests_text = ", ".join(interests) if interests else "general sightseeing"

    lines = [
        f"Create a {num_days}-day itinerary for {destination}.",
        f"Day 1 is {start_date} and the last day is {end_date}. Fill in the date of every day.",
        f"Group size: {group_size} traveler(s).",
        f"Budget: about INR {budget_per_day:,.0f} per person per day (activities, food and local transport, not hotels).",
        f"Travel style: {travel_style}. {vibe_text}",
        f"Pace: {pace}. {pace_text}",
        f"Interests: {interests_text}.",
    ]

    if dietary_restrictions:
        lines.append(f"Dietary restrictions: {', '.join(dietary_restrictions)}.")
    if mobility_concerns:
        lines.append(f"Mobility considerations: {mobility_concerns}.")

    if feedback:
        lines.append("")
        lines.append("This is a REVISION of an earlier plan.")
        if previous_summary:
            lines.append(f"The earlier plan was: {previous_summary}")
        lines.append(f"The traveler asked for this change: {feedback}")
        lines.append("Keep what still fits and change what they asked for.")

    return "\n".join(lines)


RECOMMEND_SYSTEM_PROMPT = """You are TripVibe's destination expert.
Suggest destinations that match the traveler's style, interests and budget.

RULES
1. Reply with ONE valid JSON object and nothing else. No markdown, no code fences.
2. Suggest exactly 5 destinations that are realistic for the budget.
3. Budgets are in INR, per person per day. Assume the traveler is based in India.
4. Mix well-known and lesser-known places.

JSON FORMAT
{
  "destinations": [
    {
      "name": "Destination name",
      "country": "Country",
      "why": "1-2 sentences on why it matches this traveler",
      "best_for": ["tag1", "tag2"],
      "estimated_budget_per_day": 3000
    }
  ]
}
"""


def build_recommend_prompt(
    travel_style: str,
    interests: List[str],
    budget_per_day: float,
    duration_days: int,
    group_size: int,
) -> str:
    interests_text = ", ".join(interests) if interests else "general sightseeing"
    return "\n".join([
        f"Suggest 5 destinations for a {duration_days}-day trip.",
        f"Group size: {group_size} traveler(s).",
        f"Budget: about INR {budget_per_day:,.0f} per person per day.",
        f"Travel style: {travel_style}.",
        f"Interests: {interests_text}.",
    ])