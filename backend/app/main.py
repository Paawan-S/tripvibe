import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes.trips import router as trips_router
from app.utils.errors import AppError

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(title="TripVibe API", version="1.0.0")

# CORS: which websites are allowed to call this API from a browser
allowed_origins = list({
    settings.frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/")
def home():
    return {"message": "TripVibe API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "ai_provider": settings.ai_provider,
        "ai_model": settings.groq_model,
        "groq_key_loaded": bool(settings.groq_api_key),
        "supabase_url_loaded": bool(settings.supabase_url),
        "supabase_service_key_loaded": bool(settings.supabase_service_key),
        "unsplash_key_loaded": bool(settings.unsplash_access_key),
    }


app.include_router(trips_router)