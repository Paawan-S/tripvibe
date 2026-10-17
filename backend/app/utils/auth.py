from fastapi import Header

from app.utils.db import get_supabase
from app.utils.errors import AuthError


def get_current_user_id(authorization: str = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError("Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1].strip()

    try:
        response = get_supabase().auth.get_user(token)
        user = response.user
    except Exception:
        raise AuthError("Invalid or expired token")

    if user is None:
        raise AuthError("Invalid or expired token")

    return user.id