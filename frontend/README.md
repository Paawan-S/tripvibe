# TripVibe

An AI-powered web app that turns your travel preferences into a personalized day-by-day itinerary.
Pick a vibe, a budget and your dates, and TripVibe plans each day with places grouped by area,
travel times between stops, and costs in rupees.

**Live demo:** https://tripvibe-psi.vercel.app
**API docs (interactive):** https://tripvibe-api.onrender.com/docs

> The backend runs on a free instance that sleeps when idle. The first request after a quiet
> period can take up to a minute while it wakes up. After that it is fast.

## Features

- **Accounts:** sign up and log in with Supabase Auth. Every user sees only their own trips.
- **Trip builder:** a 3-step form for vibe (7 styles), pace, interests, daily budget in INR,
  dates (up to 10 days), number of travelers, dietary needs and mobility needs.
- **AI itinerary:** morning, afternoon and evening activities per day. Places are grouped by area,
  ordered by time, and shown with duration, cost and travel time from the previous stop.
- **Destination suggestions:** not sure where to go? Get 5 AI suggestions that match your vibe,
  interests and budget.
- **Day photos:** one Unsplash photo per day, with the photographer credited.
- **Refine and regenerate:** give feedback ("more relaxed", "add street food") or switch the vibe
  or pace. Each result is saved as a new version, so nothing is overwritten.
- **Manage trips:** dashboard of saved trips, edit trip details, delete, copy a text summary, and
  download the plan as a PDF.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Framer Motion, Lucide icons |
| Backend | Python, FastAPI, Pydantic |
| Database and login | Supabase (PostgreSQL, Auth, row level security) |
| AI | Groq API (model set by `GROQ_MODEL`, default `openai/gpt-oss-120b`) |
| Photos | Unsplash API |
| Hosting | Vercel (frontend), Render (backend) |

## How it works

1. The user logs in with Supabase and fills the trip form in React.
2. React calls the FastAPI backend with the user's Supabase token.
3. The backend checks the token, turns the preferences into a structured prompt, and asks Groq
   for a JSON itinerary.
4. The reply is validated, sorted by time, and given day photos from Unsplash.
5. It is saved in Supabase as a new itinerary version, and React displays it.

More detail is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Project structure

```
tripvibe/
├── backend/            FastAPI app
│   └── app/
│       ├── routes/     HTTP endpoints (trips.py)
│       ├── services/   AI, database, photos, history
│       ├── schemas/    Pydantic request/response models
│       ├── prompts/    AI prompt templates
│       └── utils/      auth, database client, errors
├── frontend/           React app
│   └── src/            pages, components, context, services, utils
├── database/           schema.sql
├── render.yaml         backend deployment settings
└── *.md                documentation
```

## Documentation

| File | Contents |
|---|---|
| [SETUP.md](SETUP.md) | Run the project on your own machine |
| [API.md](API.md) | Every endpoint, with request and response examples |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, data flow and design decisions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deploying to Render and Vercel |
| [PROJECT_COMPLETION.md](PROJECT_COMPLETION.md) | What was built, how it was verified, known limits |

## Security notes

- API keys live in environment variables and are never committed (`.env` is in `.gitignore`).
- The Supabase service key is used only by the backend. The frontend only has the public anon key.
- The backend filters every query by the logged-in user, and the database also enforces row level
  security.

## Author

Built by Paawan Singhai as the Personalized Travel Itinerary Planner project of the Generative AI
with Google Cloud course on Skill Wallet.