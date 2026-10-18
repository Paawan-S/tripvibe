# Project completion summary

TripVibe is a full-stack AI travel planner. A React frontend collects a traveler's preferences, a
FastAPI backend turns them into a structured prompt, a Groq language model returns a day-by-day
itinerary, and Supabase stores accounts and trips. The app is deployed publicly.

**Live site:** https://tripvibe-psi.vercel.app
**Source code:** https://github.com/Paawan-S/tripvibe

## What was built, by epic

| Epic | Outcome |
|---|---|
| 1. Environment setup | Cursor and GitHub set up. The empty project skeleton and documentation files were generated with Cursor's AI agent. `.gitignore` written first so secrets can't be committed. |
| 2. Database | Supabase project with 6 tables, row level security on every table, a trigger that creates a profile at signup, and API keys kept in `.env` with a safe `.env.example`. |
| 3. Preferences and recommendations | A 3-step form (vibe, pace, interests, budget, dates, group size, dietary and mobility needs) validated on both the frontend and the backend. Prompt templates turn the answers into AI instructions. A destination suggestion endpoint helps users who don't know where to go. |
| 4. Itinerary generation | An AI service with a provider interface, JSON validation and one retry. Each day has timed activities grouped by area, with durations, costs in INR and travel times. The result is sorted by time and costs are recalculated. Vibe and pace change the plan, and feedback creates a new version that keeps context. |
| 5. Productization | Trip dashboard, edit, delete, and regenerate with saved versions. Copy-summary and PDF export. Environment-based configuration. |
| 6. Deployment | Backend on Render and frontend on Vercel, connected through CORS and environment variables. |
| 7. Testing and documentation | Scripted API test and manual checks (below). README, API, architecture, setup and deployment documents. |

## Verification

- **Scripted end-to-end API test** (`backend/test_api.py`), run against the local server and the
  deployed backend. It logs in, creates a trip, regenerates it with feedback, lists trips, fetches
  one, requests destination suggestions, and confirms that a request without a token returns 401.
- **Manual checks on the live site:** signup and login, the 3-step form with its validation
  messages, destination suggestions, itinerary view with photos and day tabs, regenerate, edit,
  copy summary, PDF export, and delete.
- **Database results:** the scripted test creates trips and itinerary versions in Supabase, and
  each action writes an entry to the `history` table.

## Known limitations

- The free Render instance sleeps when idle, so the first request after a pause can take up to a
  minute.
- Unsplash's demo mode limits photo requests to roughly 50 per hour. When the limit is reached,
  the itinerary still works without photos.
- AI output can vary between runs, and place details such as opening hours and prices should be
  confirmed before traveling.
- Regenerating rebuilds the whole itinerary. Refining a single day is done through feedback text,
  not a dedicated day-level action.
- The `preferences` and `saved_places` tables exist but the app does not use them yet.
- There is no public share link. Plans are exported by copying text or saving a PDF.
- There are no automated unit tests, only the scripted API test and manual checks.

## Possible next steps

- Save default preferences per user, using the existing `preferences` table.
- Bookmark places, using `saved_places`.
- Regenerate a single day.
- A read-only share link for a plan.
- Automated tests for the prompt builder and the AI response validation.

## How it was built

The project was built step by step with AI assistance: Cursor's agent for the initial skeleton,
and an AI chat assistant for guided development, code review and documentation. The architecture
choices and their reasons are written down in `ARCHITECTURE.md`.