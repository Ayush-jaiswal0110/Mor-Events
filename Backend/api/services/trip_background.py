"""
trip_background.py — runs itinerary generation off the request thread.

This project has no Celery/Redis/task-queue infrastructure anywhere (the
existing codebase's own async pattern, used for confirmation/invite emails
in `registrations_views.py`, is a plain daemon `threading.Thread`). We
follow that exact existing convention here rather than introducing new
infrastructure that can't be installed/verified in this environment.

This is adequate for a single-process MVP deployment (the project's
Dockerfile runs a single `gunicorn` process). For multi-worker production
scale, swap `_run_in_background` for a Celery task — see
TRIP_PLANNER_IMPLEMENTATION.md for the documented upgrade path; the
`generate_for_trip` function below has no request/response dependency so it
can be wrapped by a Celery task unchanged.
"""
import threading
import logging

from ..database import trips_collection
from ..trip_utils import now_iso, safe_error_message
from . import ai_provider
from .itinerary_generator import generate_itinerary
from .itinerary_validator import ItineraryValidationError

logger = logging.getLogger(__name__)

# In-process guard against firing two generation threads for the same trip
# at once (e.g. a double-click on "Generate"). Combined with the DB-level
# status check below, which also protects against duplicate dispatch.
_in_flight = set()
_in_flight_lock = threading.Lock()

GENERIC_FAILURE_MESSAGE = (
    "We couldn't generate your itinerary right now. Please try again in a few minutes, "
    "or contact support if this keeps happening."
)
NOT_CONFIGURED_MESSAGE = (
    "Trip planning isn't fully set up yet — an administrator needs to configure the AI "
    "provider before itineraries can be generated."
)


def queue_generation(trip_id: str):
    """Marks the trip as queued/generating and starts a background thread."""
    with _in_flight_lock:
        if trip_id in _in_flight:
            return False
        _in_flight.add(trip_id)

    trips_collection.update_one(
        {"_id": trip_id},
        {"$set": {"status": "queued", "generationError": None, "updatedAt": now_iso()}},
    )
    thread = threading.Thread(target=_run, args=(trip_id,), daemon=True)
    thread.start()
    return True


def _run(trip_id: str):
    try:
        _generate_for_trip(trip_id)
    finally:
        with _in_flight_lock:
            _in_flight.discard(trip_id)


def _generate_for_trip(trip_id: str):
    trip = trips_collection.find_one({"_id": trip_id})
    if not trip:
        logger.warning("Trip %s disappeared before generation could start", trip_id)
        return

    trips_collection.update_one(
        {"_id": trip_id},
        {"$set": {"status": "generating", "updatedAt": now_iso()}},
    )

    if not ai_provider.is_configured():
        trips_collection.update_one(
            {"_id": trip_id},
            {"$set": {
                "status": "failed",
                "generationError": NOT_CONFIGURED_MESSAGE,
                "updatedAt": now_iso(),
            }},
        )
        return

    try:
        normalized = generate_itinerary(trip)
    except (ai_provider.AIProviderError, ItineraryValidationError) as exc:
        message = safe_error_message(exc, GENERIC_FAILURE_MESSAGE)
        # Phase 10: never destroy a previously completed itinerary on a
        # failed regeneration — only overwrite status/error fields.
        trips_collection.update_one(
            {"_id": trip_id},
            {"$set": {"status": "failed", "generationError": message, "updatedAt": now_iso()}},
        )
        return
    except Exception as exc:  # noqa: BLE001 - last-resort safety net
        message = safe_error_message(exc, GENERIC_FAILURE_MESSAGE)
        trips_collection.update_one(
            {"_id": trip_id},
            {"$set": {"status": "failed", "generationError": message, "updatedAt": now_iso()}},
        )
        return

    trips_collection.update_one(
        {"_id": trip_id},
        {"$set": {
            "status": "completed",
            "generationError": None,
            "itineraryDays": normalized["itineraryDays"],
            "importantNotes": normalized["importantNotes"],
            "estimatedTotalCost": normalized["estimatedTotalCost"],
            "summary": normalized.get("summary", ""),
            "placesVerified": normalized.get("placesVerified", False),
            "updatedAt": now_iso(),
        }},
    )
