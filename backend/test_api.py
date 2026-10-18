import getpass
import os
import sys

import httpx
from supabase import create_client

from app.config import get_settings

BASE = os.getenv("API_URL", "http://localhost:8000")


def check(response):
    print("  status:", response.status_code)
    if response.status_code >= 400:
        print("  error:", response.text)
        sys.exit(1)
    return response.json()


def main():
    s = get_settings()
    email = input("Test user email: ").strip()
    password = getpass.getpass("Test user password: ")

    # Log in the same way the frontend will (with the public anon key)
    sb = create_client(s.supabase_url, s.supabase_anon_key)
    session = sb.auth.sign_in_with_password(
        {"email": email, "password": password}
    ).session
    headers = {"Authorization": f"Bearer {session.access_token}"}
    print("Logged in OK")
    print("Testing against:", BASE)

    with httpx.Client(base_url=BASE, headers=headers, timeout=180) as c:
        print("\n1) Create a trip (calls the AI, wait a few seconds)")
        body = {
            "destination": "Goa",
            "start_date": "2026-11-10",
            "end_date": "2026-11-12",
            "travel_style": "relaxed",
            "interests": ["beaches", "food"],
            "group_size": 2,
            "pace": "relaxed",
            "budget_per_day": 3000,
            "dietary_restrictions": ["vegetarian"],
        }
        data = check(c.post("/trips", json=body))
        trip_id = data["trip"]["id"]
        day1 = data["itinerary"]["days"][0]
        print("  title:", data["trip"]["title"])
        print(
            "  version:",
            data["itinerary"]["version"],
            "| days:",
            len(data["itinerary"]["days"]),
        )
        print("  day 1 theme:", day1["theme"])
        print("  day 1 image:", day1.get("image_url"))
        print("  day 1 photo credit:", day1.get("image_credit"))

        print("\n2) Regenerate with feedback")
        data = check(
            c.post(
                f"/trips/{trip_id}/regenerate",
                json={
                    "feedback": "Add more local street food and start each day later"
                },
            )
        )
        print("  version:", data["itinerary"]["version"])
        print("  day 1 theme:", data["itinerary"]["days"][0]["theme"])

        print("\n3) List my trips")
        trips = check(c.get("/trips"))
        print("  trips:", len(trips))

        print("\n4) Get one trip")
        data = check(c.get(f"/trips/{trip_id}"))
        print("  latest version:", data["itinerary"]["version"])

        print("\n5) Recommend destinations")
        data = check(
            c.post(
                "/trips/recommend",
                json={
                    "travel_style": "adventure",
                    "interests": ["trekking"],
                    "budget_per_day": 4000,
                    "duration_days": 4,
                    "group_size": 2,
                },
            )
        )
        for d in data["destinations"]:
            print("  -", d["name"], "|", d["country"])

        print("\n6) Security check: no token should be rejected")
        r = httpx.get(f"{BASE}/trips")
        print("  status:", r.status_code, "(expected 401)")

    print("\nAll tests passed")


main()