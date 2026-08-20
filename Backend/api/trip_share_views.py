"""
trip_share_views.py — sharing a trip by email (Phase 16) and the public
"view a shared trip" endpoint that the recipient's link opens.
"""
import os
import logging
import threading

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status

from .database import trips_collection, trip_shares_collection
from .utils import login_required
from .trip_utils import (
    new_id, now_iso, is_valid_email, clean_str, generate_share_token,
    check_and_increment_rate_limit, EMAIL_SHARE_LIMIT_PER_DAY,
)
from .trip_views import clean_trip_dict, _owned_trip_or_error
from .email_utils import send_trip_share_email

logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

PUBLIC_TRIP_FIELDS = {
    "destination", "startDate", "endDate", "travelersCount", "travelType",
    "budgetType", "currency", "preferredPace", "interests", "summary",
    "importantNotes", "estimatedTotalCost", "itineraryDays", "status",
    "placesVerified",
}


def _share_url(token: str) -> str:
    return f"{FRONTEND_URL}/shared-trip/{token}"


def _public_trip_view(trip: dict) -> dict:
    return {k: trip.get(k) for k in PUBLIC_TRIP_FIELDS}


@api_view(["POST"])
@login_required
def trip_share_email(request, pk):
    """POST /api/trips/<id>/share — email the itinerary link to a friend."""
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    if trip.get("status") != "completed":
        return Response(
            {"success": False, "message": "This trip doesn't have a completed itinerary to share yet."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    data = request.data
    recipient_email = clean_str(data.get("recipientEmail"), 254)
    recipient_name = clean_str(data.get("recipientName"), 100)
    message = clean_str(data.get("message"), 500)

    if not recipient_email or not is_valid_email(recipient_email):
        return Response(
            {"success": False, "message": "Validation error", "errors": [{"field": "recipientEmail", "message": "Enter a valid recipient email"}]},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    if not check_and_increment_rate_limit(user_id, "share_email", EMAIL_SHARE_LIMIT_PER_DAY):
        return Response({"success": False, "message": "Daily sharing limit reached. Please try again tomorrow."}, status=http_status.HTTP_429_TOO_MANY_REQUESTS)

    share_id = new_id("share")
    share_doc = {
        "_id": share_id,
        "tripId": pk,
        "sharedBy": user_id,
        "recipientEmail": recipient_email,
        "recipientName": recipient_name,
        "message": message,
        "shareToken": generate_share_token(),
        "status": "pending",
        "revoked": False,
        "expiresAt": None,
        "sentAt": None,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    trip_shares_collection.insert_one(share_doc)

    sender_name = request.user_info.get("email", "A MorEvents traveler")
    trip_url = _share_url(share_doc["shareToken"])

    def send_task():
        ok = send_trip_share_email(trip, share_doc, sender_name, trip_url)
        trip_shares_collection.update_one(
            {"_id": share_id},
            {"$set": {
                "status": "sent" if ok else "failed",
                "sentAt": now_iso() if ok else None,
                "updatedAt": now_iso(),
            }},
        )

    threading.Thread(target=send_task, daemon=True).start()

    return Response({
        "success": True,
        "message": "Sharing your trip now — the email will arrive shortly.",
        "data": {"id": share_id, "shareUrl": trip_url, "status": "pending"},
    }, status=http_status.HTTP_202_ACCEPTED)


@api_view(["POST"])
@login_required
def trip_share_link(request, pk):
    """POST /api/trips/<id>/share-link — get (or create) a plain shareable link, no email sent."""
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    if trip.get("status") != "completed":
        return Response(
            {"success": False, "message": "This trip doesn't have a completed itinerary to share yet."},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    share_id = new_id("share")
    share_doc = {
        "_id": share_id,
        "tripId": pk,
        "sharedBy": user_id,
        "recipientEmail": None,
        "recipientName": None,
        "message": None,
        "shareToken": generate_share_token(),
        "status": "sent",  # no email involved — link is "ready" immediately
        "revoked": False,
        "expiresAt": None,
        "sentAt": now_iso(),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    trip_shares_collection.insert_one(share_doc)

    return Response({
        "success": True,
        "data": {"id": share_id, "shareUrl": _share_url(share_doc["shareToken"])},
    }, status=http_status.HTTP_201_CREATED)


@api_view(["POST"])
@login_required
def trip_share_revoke(request, pk, share_id):
    """POST /api/trips/<id>/shares/<share_id>/revoke — invalidate a previously issued link."""
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    result = trip_shares_collection.update_one(
        {"_id": share_id, "tripId": pk},
        {"$set": {"revoked": True, "updatedAt": now_iso()}},
    )
    if result.matched_count == 0:
        return Response({"success": False, "message": "Share not found"}, status=http_status.HTTP_404_NOT_FOUND)

    return Response({"success": True, "message": "Share link revoked"}, status=http_status.HTTP_200_OK)


@api_view(["GET"])
@login_required
def trip_shares_list(request, pk):
    """GET /api/trips/<id>/shares — list share links/emails issued for this trip (owner only)."""
    user_id = request.user_info.get("id")
    trip, error = _owned_trip_or_error(pk, user_id)
    if error:
        return error

    shares = list(trip_shares_collection.find({"tripId": pk}).sort([("createdAt", -1)]))
    data = []
    for s in shares:
        data.append({
            "id": s["_id"],
            "recipientEmail": s.get("recipientEmail"),
            "recipientName": s.get("recipientName"),
            "status": s.get("status"),
            "revoked": s.get("revoked", False),
            "sentAt": s.get("sentAt"),
            "createdAt": s.get("createdAt"),
            "shareUrl": _share_url(s["shareToken"]) if not s.get("revoked") else None,
        })
    return Response({"success": True, "data": data}, status=http_status.HTTP_200_OK)


@api_view(["GET"])
def shared_trip_public_view(request, token):
    """
    GET /api/shared-trips/<token> — PUBLIC endpoint (no auth) that the
    recipient's link opens. Deliberately returns only itinerary content —
    never the owner's id/email or other private fields.
    """
    share = trip_shares_collection.find_one({"shareToken": token})
    if not share or share.get("revoked"):
        return Response({"success": False, "message": "This shared trip link is no longer available."}, status=http_status.HTTP_404_NOT_FOUND)

    expires_at = share.get("expiresAt")
    if expires_at and expires_at < now_iso():
        return Response({"success": False, "message": "This shared trip link has expired."}, status=http_status.HTTP_404_NOT_FOUND)

    trip = trips_collection.find_one({"_id": share["tripId"]})
    if not trip:
        return Response({"success": False, "message": "This trip is no longer available."}, status=http_status.HTTP_404_NOT_FOUND)

    return Response({"success": True, "data": _public_trip_view(trip)}, status=http_status.HTTP_200_OK)
