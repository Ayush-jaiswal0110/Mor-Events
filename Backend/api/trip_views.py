"""
trip_views.py — CRUD + generation endpoints for the "Plan My Trip" feature.

Mirrors the conventions of `events_views.py`/`registrations_views.py`:
function-based `@api_view` views, plain dict Mongo documents, a
`{success, message, data}` response envelope, and `login_required` for
anything private. There are no DRF serializers/viewsets anywhere in this
project, so none are introduced here either.

Every private endpoint below requires a valid JWT (any traveler or admin
token — `login_required` doesn't distinguish, matching how the rest of the
app works) AND enforces per-trip ownership: a user can only ever see/edit/
delete/generate their own trips.
"""
import math
import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status

from .database import trips_collection, trip_shares_collection
from .utils import login_required
from .trip_utils import (
    new_id, now_iso, validate_trip_payload, ValidationError,
    check_and_increment_rate_limit, TRIP_GENERATION_LIMIT_PER_DAY,
    TRIP_REGENERATION_LIMIT_PER_DAY, compute_day_count, MAX_TRIP_DAYS,
)
from .services.trip_background import queue_generation

logger = logging.getLogger(__name__)

REGENERATION_AFFECTING_FIELDS = {
    "destination", "startDate", "endDate", "travelersCount", "travelType",
    "budgetType", "budgetAmount", "interests", "foodPreferences",
    "dietaryRestrictions", "preferredPace", "travelMode", "startingCity",
}


def clean_trip_dict(trip: dict) -> dict:
    trip = dict(trip)
    trip["id"] = trip.pop("_id")
    return trip


def _owned_trip_or_error(pk, user_id):
    trip = trips_collection.find_one({"_id": pk})
    if not trip:
        return None, Response({"success": False, "message": "Trip not found"}, status=http_status.HTTP_404_NOT_FOUND)
    if trip.get("userId") != user_id:
        # 404 rather than 403 to avoid confirming that a trip ID exists for another user.
        return None, Response({"success": False, "message": "Trip not found"}, status=http_status.HTTP_404_NOT_FOUND)
    return trip, None


@api_view(["GET", "POST"])
@login_required
def trips_list(request):
    user_id = request.user_info.get("id")

    if request.method == "GET":
        query = {"userId": user_id}

        status_filter = request.GET.get("status")
        if status_filter and status_filter != "all":
            query["status"] = status_filter

        search = request.GET.get("search")
        if search:
            query["destination"] = {"$regex": search[:100], "$options": "i"}

        limit = min(int(request.GET.get("limit", 20) or 20), 100)
        page = max(int(request.GET.get("page", 1) or 1), 1)
        skip = (page - 1) * limit

        sort_field = request.GET.get("sortBy", "createdAt")
        sort_dir = -1 if request.GET.get("sortDir", "desc") == "desc" else 1
        if sort_field not in {"createdAt", "updatedAt", "startDate", "destination"}:
            sort_field = "createdAt"

        total_items = trips_collection.count_documents(query)
        cursor = trips_collection.find(
            query,
            projection={"itineraryDays": 0},  # list view doesn't need the full itinerary payload
        ).sort([(sort_field, sort_dir)]).skip(skip).limit(limit)

        trips = [clean_trip_dict(t) for t in cursor]

        return Response({
            "success": True,
            "data": trips,
            "pagination": {
                "currentPage": page,
                "totalPages": math.ceil(total_items / limit) if limit else 1,
                "totalItems": total_items,
                "itemsPerPage": limit,
            },
        }, status=http_status.HTTP_200_OK)

    # POST — create trip
    try:
        cleaned = validate_trip_payload(request.data, partial=False)
    except ValidationError as exc:
        return Response(
            {"success": False, "message": "Validation error", "errors": exc.errors},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    trip_id = new_id("trip")
    trip_doc = {
        "_id": trip_id,
        "userId": user_id,
        "title": cleaned.get("title") or f"Trip to {cleaned['destination']}",
        "destination": cleaned["destination"],
        "destinationCountry": None,
        "latitude": None,
        "longitude": None,
        "startDate": cleaned["startDate"],
        "endDate": cleaned["endDate"],
        "arrivalDate": cleaned.get("arrivalDate"),
        "arrivalTime": cleaned.get("arrivalTime"),
        "departureDate": cleaned.get("departureDate"),
        "departureTime": cleaned.get("departureTime"),
        "startingCity": cleaned.get("startingCity"),
        "travelersCount": cleaned["travelersCount"],
        "travelType": cleaned["travelType"],
        "budgetType": cleaned["budgetType"],
        "budgetAmount": cleaned.get("budgetAmount"),
        "currency": cleaned.get("currency", "INR"),
        "preferredPace": cleaned.get("preferredPace") or "balanced",
        "interests": cleaned.get("interests", []),
        "foodPreferences": cleaned.get("foodPreferences", []),
        "dietaryRestrictions": cleaned.get("dietaryRestrictions"),
        "travelMode": cleaned.get("travelMode"),
        "accommodationPreference": cleaned.get("accommodationPreference"),
        "hotelLocation": cleaned.get("hotelLocation"),
        "accessibilityRequirements": cleaned.get("accessibilityRequirements"),
        "specialRequests": cleaned.get("specialRequests"),
        "status": "queued",
        "generationVersion": 1,
        "generationError": None,
        "needsRegeneration": False,
        "estimatedTotalCost": None,
        "summary": "",
        "importantNotes": [],
        "itineraryDays": [],
        "placesVerified": False,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }

    if not check_and_increment_rate_limit(user_id, "generate", TRIP_GENERATION_LIMIT_PER_DAY):
        trip_doc["status"] = "draft"
        trips_collection.insert_one(trip_doc)
        return Response({
            "success": True,
            "message": "Trip saved, but you've reached today's generation limit. Try generating again tomorrow.",
            "data": clean_trip_dict(trip_doc),
        }, status=http_status.HTTP_201_CREATED)

    trips_collection.insert_one(trip_doc)
    queue_generation(trip_id)

    return Response({
        "success": True,
        "message": "Trip created — generating your itinerary now.",
        "data": clean_trip_dict(trip_doc),
    }, status=http_status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@login_required
def trip_detail(request, pk):
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    if request.method == "GET":
        return Response({"success": True, "data": clean_trip_dict(trip)}, status=http_status.HTTP_200_OK)

    if request.method == "DELETE":
        trips_collection.delete_one({"_id": pk})
        trip_shares_collection.delete_many({"tripId": pk})
        return Response({"success": True, "message": "Trip deleted successfully"}, status=http_status.HTTP_200_OK)

    # PATCH — edit trip details (Phase 15)
    try:
        cleaned = validate_trip_payload(request.data, partial=True)
    except ValidationError as exc:
        return Response(
            {"success": False, "message": "Validation error", "errors": exc.errors},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    if not cleaned:
        return Response({"success": False, "message": "No valid fields to update"}, status=http_status.HTTP_400_BAD_REQUEST)

    # Cross-field check: if only one of start/end date changed, re-validate ordering against the stored value.
    new_start = cleaned.get("startDate", trip.get("startDate"))
    new_end = cleaned.get("endDate", trip.get("endDate"))
    if new_end < new_start:
        return Response(
            {"success": False, "message": "Validation error", "errors": [{"field": "endDate", "message": "End date cannot be before start date"}]},
            status=http_status.HTTP_400_BAD_REQUEST,
        )
    if compute_day_count(new_start, new_end) > MAX_TRIP_DAYS:
        return Response(
            {"success": False, "message": "Validation error", "errors": [{"field": "endDate", "message": f"Trips longer than {MAX_TRIP_DAYS} days are not supported yet"}]},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    needs_regen = trip.get("status") == "completed" and bool(REGENERATION_AFFECTING_FIELDS & set(cleaned.keys()))
    cleaned["updatedAt"] = now_iso()
    if needs_regen:
        cleaned["needsRegeneration"] = True

    trips_collection.update_one({"_id": pk}, {"$set": cleaned})
    updated = trips_collection.find_one({"_id": pk})

    return Response({
        "success": True,
        "message": "Trip updated successfully",
        "data": clean_trip_dict(updated),
    }, status=http_status.HTTP_200_OK)


@api_view(["POST"])
@login_required
def trip_generate(request, pk):
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    if trip.get("status") in ("queued", "generating"):
        return Response({"success": True, "message": "Generation already in progress", "data": {"status": trip["status"]}}, status=http_status.HTTP_200_OK)

    if not check_and_increment_rate_limit(user_id, "generate", TRIP_GENERATION_LIMIT_PER_DAY):
        return Response({"success": False, "message": "Daily generation limit reached. Please try again tomorrow."}, status=http_status.HTTP_429_TOO_MANY_REQUESTS)

    trips_collection.update_one({"_id": pk}, {"$set": {"needsRegeneration": False, "updatedAt": now_iso()}})
    queue_generation(pk)

    return Response({"success": True, "message": "Itinerary generation started", "data": {"status": "queued"}}, status=http_status.HTTP_202_ACCEPTED)


@api_view(["POST"])
@login_required
def trip_regenerate(request, pk):
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    if trip.get("status") in ("queued", "generating"):
        return Response({"success": True, "message": "Generation already in progress", "data": {"status": trip["status"]}}, status=http_status.HTTP_200_OK)

    if not check_and_increment_rate_limit(user_id, "regenerate", TRIP_REGENERATION_LIMIT_PER_DAY):
        return Response({"success": False, "message": "Daily regeneration limit reached. Please try again tomorrow."}, status=http_status.HTTP_429_TOO_MANY_REQUESTS)

    # Bump the version but deliberately do NOT clear itineraryDays here —
    # trip_background only overwrites them once the new generation
    # succeeds, so a failed regeneration preserves the last good itinerary.
    trips_collection.update_one(
        {"_id": pk},
        {"$inc": {"generationVersion": 1}, "$set": {"needsRegeneration": False, "updatedAt": now_iso()}},
    )
    queue_generation(pk)

    return Response({"success": True, "message": "Regenerating your itinerary", "data": {"status": "queued"}}, status=http_status.HTTP_202_ACCEPTED)


@api_view(["GET"])
@login_required
def trip_status(request, pk):
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    return Response({
        "success": True,
        "data": {
            "status": trip.get("status"),
            "generationError": trip.get("generationError"),
            "generationVersion": trip.get("generationVersion"),
            "needsRegeneration": trip.get("needsRegeneration", False),
        },
    }, status=http_status.HTTP_200_OK)
