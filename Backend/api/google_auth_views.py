"""
google_auth_views.py — consumer ("traveler") Google Sign-In.

This is intentionally separate from `auth_views.py`, which only handles the
single hardcoded admin login — that flow is untouched. There was no
consumer account system in this codebase before the Plan My Trip feature,
so this introduces the first one, reusing the exact same JWT scheme
(`generate_token`/`decode_token`/`login_required` from `api/utils.py`) so
the rest of the app's auth plumbing (Bearer header, 401 handling on the
frontend, etc.) works unchanged for both admin and consumer sessions.

Security notes (Phase 2 / Phase 17):
- The Google ID token is verified server-side (signature, audience, issuer,
  expiry) via `google.oauth2.id_token.verify_oauth2_token`. The browser's
  claims about who the user is are never trusted directly.
- GOOGLE_CLIENT_ID is a public value by design (it's sent to the browser to
  initialize Google Identity Services) — GOOGLE_CLIENT_SECRET is never used
  by this flow and is never sent to the frontend.
"""
import os
import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status

from .database import users_collection
from .utils import generate_token, login_required
from .trip_utils import new_id, now_iso, is_valid_email, clean_str

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


def _public_user(user: dict) -> dict:
    return {
        "id": user["_id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "phone": user.get("phone"),
        "picture": user.get("picture"),
        "role": "user",
    }


@api_view(["POST"])
def google_login_view(request):
    """
    POST /api/auth/google
    Body: { "credential": "<Google ID token from Google Identity Services>" }
    """
    credential = request.data.get("credential")
    if not credential:
        return Response(
            {"success": False, "message": "Missing Google credential"},
            status=http_status.HTTP_400_BAD_REQUEST,
        )

    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID is not configured on the server")
        return Response(
            {"success": False, "message": "Google sign-in is not configured. Please try again later."},
            status=http_status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        # Imported lazily so the rest of the app still works even in
        # environments where google-auth hasn't been installed yet.
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        claims = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), audience=GOOGLE_CLIENT_ID
        )
    except ImportError:
        logger.exception("google-auth is not installed")
        return Response(
            {"success": False, "message": "Google sign-in is temporarily unavailable."},
            status=http_status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except ValueError as exc:
        # Covers bad signature, wrong audience, wrong issuer, expired token, etc.
        logger.warning("Rejected invalid Google credential: %s", exc)
        return Response(
            {"success": False, "message": "Could not verify your Google sign-in. Please try again."},
            status=http_status.HTTP_401_UNAUTHORIZED,
        )

    issuer = claims.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        return Response({"success": False, "message": "Invalid token issuer"}, status=http_status.HTTP_401_UNAUTHORIZED)

    if not claims.get("email_verified", False):
        return Response(
            {"success": False, "message": "Please verify your email with Google before continuing."},
            status=http_status.HTTP_401_UNAUTHORIZED,
        )

    google_sub = claims.get("sub")
    email = claims.get("email")
    if not google_sub or not is_valid_email(email or ""):
        return Response({"success": False, "message": "Invalid Google account"}, status=http_status.HTTP_401_UNAUTHORIZED)

    name = claims.get("name") or email.split("@")[0]
    picture = claims.get("picture")

    existing = users_collection.find_one({"googleSub": google_sub})
    if not existing:
        # A user may already exist by email if they somehow ended up in the
        # collection another way — link rather than duplicate.
        existing = users_collection.find_one({"email": email})

    if existing:
        # Don't clobber a name/photo the traveler has since customized on
        # their Profile page — only fill these in if still unset.
        update_fields = {"googleSub": google_sub, "lastLoginAt": now_iso()}
        if not existing.get("name"):
            update_fields["name"] = name
        if not existing.get("picture"):
            update_fields["picture"] = picture
        users_collection.update_one({"_id": existing["_id"]}, {"$set": update_fields})
        user_doc = users_collection.find_one({"_id": existing["_id"]})
    else:
        user_id = new_id("user")
        user_doc = {
            "_id": user_id,
            "googleSub": google_sub,
            "email": email,
            "name": name,
            "picture": picture,
            "createdAt": now_iso(),
            "lastLoginAt": now_iso(),
        }
        users_collection.insert_one(user_doc)

    token = generate_token(user_doc["_id"], user_doc["email"], role="user")

    return Response(
        {"success": True, "token": token, "user": _public_user(user_doc)},
        status=http_status.HTTP_200_OK,
    )


@api_view(["GET", "PATCH"])
@login_required
def current_user_view(request):
    """
    GET /api/auth/me — returns the full profile for the signed-in traveler.
    PATCH /api/auth/me — updates profile fields (name, phone). Email comes
    from the verified Google account and is never editable here.
    """
    user_id = request.user_info.get("id")
    user_doc = users_collection.find_one({"_id": user_id})
    if not user_doc:
        return Response({"success": False, "message": "User not found"}, status=http_status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response({"success": True, "user": _public_user(user_doc)}, status=http_status.HTTP_200_OK)

    # PATCH — update profile
    data = request.data
    updates = {}
    errors = []

    if "name" in data:
        name = clean_str(data.get("name"), 100)
        if not name:
            errors.append({"field": "name", "message": "Name cannot be empty"})
        else:
            updates["name"] = name

    if "phone" in data:
        phone = clean_str(data.get("phone"), 20)
        if phone and (len(phone) < 7 or not all(c.isdigit() or c in "+ -()" for c in phone)):
            errors.append({"field": "phone", "message": "Enter a valid phone number"})
        else:
            updates["phone"] = phone

    if errors:
        return Response({"success": False, "message": "Validation error", "errors": errors}, status=http_status.HTTP_400_BAD_REQUEST)

    if not updates:
        return Response({"success": False, "message": "No valid fields to update"}, status=http_status.HTTP_400_BAD_REQUEST)

    updates["updatedAt"] = now_iso()
    users_collection.update_one({"_id": user_id}, {"$set": updates})
    updated_doc = users_collection.find_one({"_id": user_id})

    return Response({"success": True, "message": "Profile updated", "user": _public_user(updated_doc)}, status=http_status.HTTP_200_OK)
