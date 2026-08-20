"""
trip_utils.py — shared helpers for the "Plan My Trip" feature.

Follows the same conventions as the rest of the `api` app: string IDs with a
short prefix, plain dict documents, and small pure-Python helper functions
rather than DRF serializers/permission classes (this codebase doesn't use
either anywhere else).
"""
import os
import re
import secrets
import uuid
import logging
from datetime import datetime, date, timedelta

from .database import rate_limits_collection

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config (all overridable via environment variables, sane defaults for MVP)
# ---------------------------------------------------------------------------

MAX_TRIP_DAYS = int(os.getenv("MAX_TRIP_DAYS", "14"))
MAX_TRAVELERS = int(os.getenv("MAX_TRAVELERS", "20"))
TRIP_GENERATION_LIMIT_PER_DAY = int(os.getenv("TRIP_GENERATION_LIMIT_PER_DAY", "10"))
TRIP_REGENERATION_LIMIT_PER_DAY = int(os.getenv("TRIP_REGENERATION_LIMIT_PER_DAY", "10"))
EMAIL_SHARE_LIMIT_PER_DAY = int(os.getenv("EMAIL_SHARE_LIMIT_PER_DAY", "20"))

TRAVEL_TYPES = {"solo", "couple", "family", "friends", "business"}
BUDGET_TYPES = {"budget", "moderate", "luxury", "custom"}
PACE_TYPES = {"relaxed", "balanced", "fast_paced"}
TRIP_STATUSES = {"draft", "queued", "generating", "completed", "failed"}
ITEM_TYPES = {
    "breakfast", "sightseeing", "activity", "travel", "lunch", "rest",
    "check_in", "check_out", "shopping", "snack", "dinner", "nightlife",
    "free_time",
}
INTERESTS = {
    "nature", "adventure", "culture", "history", "museums", "religious_places",
    "food", "shopping", "nightlife", "beaches", "mountains", "wildlife",
    "photography", "relaxation", "local_experiences", "family_activities",
}
FOOD_PREFERENCES = {
    "local_food", "vegetarian", "vegan", "non_vegetarian", "street_food",
    "fine_dining", "cafes", "desserts", "no_preference",
}

MAX_TEXT_LEN = 500
MAX_NOTE_LEN = 1000

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def is_valid_email(value: str) -> bool:
    return bool(value) and bool(EMAIL_RE.match(value.strip())) and len(value) <= 254


def parse_iso_date(value: str):
    """Return a date object or None if `value` isn't a valid YYYY-MM-DD date."""
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def clean_str(value, max_len=MAX_TEXT_LEN):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    return value[:max_len]


def clean_str_list(value, max_items=20, max_len=60):
    if not value:
        return []
    if not isinstance(value, list):
        return []
    out = []
    for v in value[:max_items]:
        s = clean_str(v, max_len)
        if s:
            out.append(s)
    return out


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors if isinstance(errors, list) else [errors]
        super().__init__("; ".join(str(e) for e in self.errors))


def validate_trip_payload(data: dict, partial: bool = False) -> dict:
    """
    Validate + normalize the trip form payload (Phase 4 rules).
    Raises ValidationError with a list of {field, message} dicts.
    Returns a cleaned dict containing only recognized fields that were
    actually supplied (so PATCH can do a partial update).
    """
    errors = []
    cleaned = {}

    def require(field):
        if not partial and (field not in data or data.get(field) in (None, "")):
            errors.append({"field": field, "message": f"{field} is required"})
            return False
        return True

    # --- Destination ---
    if "destination" in data or not partial:
        if require("destination"):
            destination = clean_str(data.get("destination"), 150)
            if not destination:
                errors.append({"field": "destination", "message": "Destination is required"})
            else:
                cleaned["destination"] = destination

    # --- Dates ---
    start_date = end_date = None
    if "startDate" in data or not partial:
        if require("startDate"):
            start_date = parse_iso_date(data.get("startDate"))
            if not start_date:
                errors.append({"field": "startDate", "message": "Start date is invalid"})
            else:
                cleaned["startDate"] = start_date.isoformat()

    if "endDate" in data or not partial:
        if require("endDate"):
            end_date = parse_iso_date(data.get("endDate"))
            if not end_date:
                errors.append({"field": "endDate", "message": "End date is invalid"})
            else:
                cleaned["endDate"] = end_date.isoformat()

    if start_date and end_date:
        if end_date < start_date:
            errors.append({"field": "endDate", "message": "End date cannot be before start date"})
        elif (end_date - start_date).days + 1 > MAX_TRIP_DAYS:
            errors.append({
                "field": "endDate",
                "message": f"Trips longer than {MAX_TRIP_DAYS} days are not supported yet",
            })

    # --- Travelers ---
    if "travelersCount" in data or not partial:
        if require("travelersCount"):
            try:
                travelers = int(data.get("travelersCount"))
            except (TypeError, ValueError):
                travelers = None
            if travelers is None or travelers < 1:
                errors.append({"field": "travelersCount", "message": "Traveler count must be at least 1"})
            elif travelers > MAX_TRAVELERS:
                errors.append({"field": "travelersCount", "message": f"Traveler count cannot exceed {MAX_TRAVELERS}"})
            else:
                cleaned["travelersCount"] = travelers

    # --- Travel type ---
    if "travelType" in data or not partial:
        if require("travelType"):
            travel_type = clean_str(data.get("travelType"), 20)
            if travel_type not in TRAVEL_TYPES:
                errors.append({"field": "travelType", "message": "Invalid travel type"})
            else:
                cleaned["travelType"] = travel_type

    # --- Budget ---
    if "budgetType" in data or not partial:
        if require("budgetType"):
            budget_type = clean_str(data.get("budgetType"), 20)
            if budget_type not in BUDGET_TYPES:
                errors.append({"field": "budgetType", "message": "Invalid budget type"})
            else:
                cleaned["budgetType"] = budget_type
                if budget_type == "custom":
                    amount = data.get("budgetAmount")
                    try:
                        amount = float(amount)
                    except (TypeError, ValueError):
                        amount = None
                    if amount is None or amount <= 0:
                        errors.append({"field": "budgetAmount", "message": "Enter a valid custom budget amount"})
                    else:
                        cleaned["budgetAmount"] = round(amount, 2)
                    currency = clean_str(data.get("currency"), 6) or "INR"
                    cleaned["currency"] = currency.upper()
    if "currency" in data and "currency" not in cleaned:
        cleaned["currency"] = (clean_str(data.get("currency"), 6) or "INR").upper()

    # --- Optional fields ---
    optional_str_fields = {
        "startingCity": 150,
        "arrivalTime": 10,
        "departureTime": 10,
        "travelMode": 40,
        "foodPreferencesText": 200,
        "dietaryRestrictions": 200,
        "preferredPace": 20,
        "accommodationPreference": 100,
        "hotelLocation": 200,
        "accessibilityRequirements": MAX_NOTE_LEN,
        "specialRequests": MAX_NOTE_LEN,
        "title": 150,
    }
    for field, max_len in optional_str_fields.items():
        if field in data:
            cleaned[field] = clean_str(data.get(field), max_len)

    if "arrivalDate" in data:
        d = parse_iso_date(data.get("arrivalDate"))
        cleaned["arrivalDate"] = d.isoformat() if d else None
    if "departureDate" in data:
        d = parse_iso_date(data.get("departureDate"))
        cleaned["departureDate"] = d.isoformat() if d else None

    if "preferredPace" in cleaned and cleaned["preferredPace"] and cleaned["preferredPace"] not in PACE_TYPES:
        errors.append({"field": "preferredPace", "message": "Invalid preferred pace"})

    if "interests" in data:
        interests = clean_str_list(data.get("interests"))
        invalid = [i for i in interests if i not in INTERESTS]
        if invalid:
            errors.append({"field": "interests", "message": f"Unknown interests: {', '.join(invalid)}"})
        else:
            cleaned["interests"] = interests

    if "foodPreferences" in data:
        prefs = clean_str_list(data.get("foodPreferences"))
        invalid = [p for p in prefs if p not in FOOD_PREFERENCES]
        if invalid:
            errors.append({"field": "foodPreferences", "message": f"Unknown food preferences: {', '.join(invalid)}"})
        else:
            cleaned["foodPreferences"] = prefs

    if errors:
        raise ValidationError(errors)

    return cleaned


def compute_day_count(start_date_str: str, end_date_str: str) -> int:
    start = parse_iso_date(start_date_str)
    end = parse_iso_date(end_date_str)
    if not start or not end:
        return 0
    return (end - start).days + 1


def trip_dates(start_date_str: str, end_date_str: str):
    start = parse_iso_date(start_date_str)
    end = parse_iso_date(end_date_str)
    if not start or not end:
        return []
    days = []
    current = start
    while current <= end:
        days.append(current.isoformat())
        current += timedelta(days=1)
    return days


def check_and_increment_rate_limit(user_id: str, action: str, daily_limit: int) -> bool:
    """
    Very small Mongo-backed rate limiter (no Redis in this project).
    Returns True if the action is allowed (and records it), False if the
    caller has hit their daily limit for that action.
    """
    if daily_limit <= 0:
        return True
    bucket = f"{user_id}:{action}:{date.today().isoformat()}"
    doc = rate_limits_collection.find_one_and_update(
        {"_id": bucket},
        {"$inc": {"count": 1}, "$setOnInsert": {"createdAt": now_iso()}},
        upsert=True,
        return_document=True,
    )
    count = doc.get("count", 1) if doc else 1
    if count > daily_limit:
        return False
    return True


def generate_share_token() -> str:
    """Cryptographically secure, hard-to-guess share token."""
    return secrets.token_urlsafe(32)


def safe_error_message(exc: Exception, fallback: str) -> str:
    """
    Never leak raw provider/stack-trace details to the client or store them
    on the trip document — log the real exception, persist a generic one.
    """
    logger.error("Trip planner error: %s", exc, exc_info=True)
    return fallback
