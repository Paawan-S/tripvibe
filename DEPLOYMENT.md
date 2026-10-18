# Deployment

| Part | Host | Address |
|---|---|---|
| Frontend | Vercel | https://tripvibe-psi.vercel.app |
| Backend | Render (free web service) | https://tripvibe-api.onrender.com |
| Database and login | Supabase | managed |

Both hosts deploy automatically when `main` is pushed to GitHub.

## Backend on Render

Create a **Web Service** from the GitHub repository with these settings. They are also recorded
in `render.yaml`.

| Setting | Value |
|---|---|
| Language | Python 3 |
| Branch | `main` |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Instance type | Free |
| Health Check Path | `/health` |

Environment variables:

| Variable | Value |
|---|---|
| `PYTHON_VERSION` | A full version that matches local development, for example `3.12.x` |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | secret |
| `GROQ_MODEL` | `openai/gpt-oss-120b` (or another current Groq model) |
| `UNSPLASH_ACCESS_KEY` | secret |
| `SUPABASE_URL` | the project URL |
| `SUPABASE_ANON_KEY` | the anon key |
| `SUPABASE_SERVICE_KEY` | secret, backend only |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | the exact Vercel address, with no trailing slash and no path |

Render assigns `PORT` by itself, so it is not set here.

## Frontend on Vercel

Import the repository as a project.

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Environment variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | the Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | the anon key (never the service key) |
| `VITE_API_URL` | `https://tripvibe-api.onrender.com`, with no trailing slash and no `/api` |

`VITE_` values are written into the site **at build time**. After changing one, redeploy.

`frontend/vercel.json` rewrites every path to `index.html`. Without it, refreshing a page such as
`/trips/123` returns a 404, because that address only exists inside the React app.

## Connecting the two

The browser only lets the site call the API if the API allows the site's address (CORS):

1. Deploy the backend and note its address.
2. Deploy the frontend with `VITE_API_URL` set to that address.
3. Set `FRONTEND_URL` on Render to the Vercel address and let Render redeploy.

Use the main production address only. Vercel's temporary preview links are not on the allow-list.

## Supabase settings

- **Authentication, Sign In / Providers, Email:** decide whether **Confirm email** is on. With it
  on, new users must click the emailed link before logging in.
- **Authentication, URL Configuration:** set the **Site URL** to the Vercel address so
  confirmation links point to the live site.

## Updating

Push to `main`. Render and Vercel rebuild by themselves. Changing an environment variable on
Render redeploys automatically. On Vercel, redeploy the latest build after changing a variable.

## Free-tier behaviour

- The Render instance sleeps after about 15 minutes without traffic. The next request can take
  30 to 60 seconds. Open `/health` shortly before a demo to wake it.
- Unsplash's demo mode allows about 50 requests per hour. Each trip uses roughly one per day of
  the trip. Photos are optional, so the app keeps working when the limit is reached.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser console: "blocked by CORS policy" | `FRONTEND_URL` on Render doesn't match the site address exactly, or Render hasn't finished redeploying |
| `Failed to fetch` with the request going to `localhost:8000` | `VITE_API_URL` was missing at build time. Add it and redeploy Vercel |
| 404 on refresh | `vercel.json` is missing from `frontend` |
| `No open ports detected` in the Render log | The start command lacks `--host 0.0.0.0 --port $PORT` |
| `ModuleNotFoundError: No module named 'app'` | Root Directory on Render isn't `backend` |
| 502 when generating | Check `GROQ_API_KEY` and `GROQ_MODEL` |
| `Invalid or expired token` | The Supabase URL or keys differ between the frontend and the backend |
| Build fails with `Could not resolve` | File names are case-sensitive on Vercel. Match the exact capitalization of imports |