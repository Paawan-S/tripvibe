import logging
from functools import lru_cache
from typing import Any, Dict, Optional

from app.utils.db import get_supabase

logger = logging.getLogger(__name__)


class HistoryService:
    """Writes a line to the history table whenever the user does something."""

    def __init__(self):
        self.db = get_supabase()

    def log(self, user_id: str, action: str, details: Optional[Dict[str, Any]] = None) -> None:
        try:
            self.db.table("history").insert(
                {"user_id": user_id, "action": action, "details": details}
            ).execute()
        except Exception as e:
            # History is nice to have. It must never break the real request.
            logger.warning("Could not write history: %s", e)


@lru_cache
def get_history_service() -> HistoryService:
    return HistoryService()