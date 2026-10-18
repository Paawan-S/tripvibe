# Setup: run TripVibe locally

## Prerequisites

- Python 3.12 or newer
- Node.js 20.19 or newer
- Git
- Free accounts: [Supabase](https://supabase.com), [Groq](https://console.groq.com),
  [Unsplash Developers](https://unsplash.com/developers)

## 1. Get the code

```
git clone https://github.com/Paawan-S/tripvibe.git
cd tripvibe
```

## 2. Create the database (Supabase)

1. Create a new Supabase project (free plan).
2. Open **SQL Editor**, paste the whole of `database/schema.sql`, and click **Run**.
   You should see "Success. No rows returned" and 6 tables in **Table Editor**.
3. Optional, for easier local testing: **Authentication, Sign In / Providers, Email**, turn
   **Confirm email** off.
4. Collect these values from **Project Settings**:
   - Project URL (Data API page)
   - `anon public` key and `service_role` key (API Keys page, "Legacy anon, service_role" tab)

## 3. Get the AI and photo keys

- **Groq:** console.groq.com, **API Keys**, **Create API Key**. The key is shown only once.
- **Unsplash:** create an application and copy its **Access Key** (not the Secret Key).

## 4. Backend

```
cd backend
python -m venv venv
venv\Scripts\activate          # Windows. On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your values:

```
AI_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-120b
UNSPLASH_ACCESS_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
ENVIRONMENT=development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Start the API:

```
uvicorn app.main:app --reload
```

Check http://127.0.0.1:8000/health. It should show `"status": "ok"` and every `*_loaded` value
as `true`. Interactive API docs are at http://127.0.0.1:8000/docs.

## 5. Frontend

In a second terminal:

```
cd frontend
npm install
```

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=...        # same Project URL as the backend
VITE_SUPABASE_ANON_KEY=...   # the anon key only, never the service key
VITE_API_URL=http://localhost:8000
```

```
npm run dev
```

Open http://localhost:5173, sign up, and plan a trip.

## 6. Optional: scripted API test

With the backend running and a user created (sign up in the app, or add one in Supabase,
**Authentication, Users**):

```
cd backend
python test_api.py
```

It asks for the user's email and password, then creates a trip, regenerates it, lists trips,
fetches one, asks for destination suggestions, and checks that a request without a token is
rejected with 401. To test a deployed backend instead:

```
$env:API_URL="https://tripvibe-api.onrender.com"     # PowerShell
python test_api.py
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to fetch` in the browser | The backend isn't running, or `VITE_API_URL` is wrong. Restart `npm run dev` after editing `.env`. |
| CORS error in the console | `FRONTEND_URL` in `backend/.env` must exactly match the address of the site (no trailing slash). |
| `Invalid or expired token` | Log out and log in again. Check both `.env` files use the same Supabase project. |
| `model_decommissioned` or `model_not_found` | Groq retires models over time. Set `GROQ_MODEL` to a current model from console.groq.com/docs/models. |
| `column ... does not exist` | The database doesn't match the code. Use the current `database/schema.sql` on a fresh project. |
| No day photos | Unsplash's demo limit is about 50 requests per hour. Photos return after the hour resets. |
| `ModuleNotFoundError` | The virtual environment isn't active, or you are not inside `backend`. |