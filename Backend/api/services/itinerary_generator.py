"""
itinerary_generator.py — orchestrates the full generation pipeline for one
trip: normalize destination -> fetch verified places -> build the AI prompt
-> call the AI provider -> validate the response -> (retry once on
validation failure) -> return a normalized itinerary dict.

This module never touches the database directly and never calls the AI
provider from a view/serializer — `trip_background.py` is the only caller.
"""
import json
import logging

from . import ai_provider, places_provider
from .itinerary_validator import validate_itinerary, ItineraryValidationError
from ..trip_utils import trip_dates

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a meticulous travel-itinerary planner for MorEvents, an Indian \
travel & trekking company. You produce realistic, day-wise trip itineraries as a single \
JSON object and nothing else (no markdown, no commentary, no code fences).

Hard rules:
1. Produce exactly one itinerary day per trip date supplied, numbered 1..N in order, and every "date" field must exactly match the corresponding date supplied.
2. Each day must have a realistic schedule: sensible wake-up time, breakfast where appropriate, morning activities, travel/transfer time between locations, lunch, afternoon activities, rest/free time, evening activities, dinner, and respect the traveler's arrival/departure times on the first/last day.
3. Group nearby places together to minimize travel; avoid criss-crossing the destination.
4. Respect the traveler's interests, food preferences, dietary restrictions and pace (relaxed = fewer, longer stops; fast_paced = more stops per day).
5. Never invent exact opening hours or exact prices you aren't given — if you don't have verified data, describe costs as estimates and say so in "notes" rather than stating a precise invented figure.
6. Never claim any booking, reservation or ticket has been completed — you are only producing a plan.
7. Do not repeat the same attraction on two different days.
8. If "verifiedPlaces" are supplied, prefer using them (and their name/address) over inventing new places, but you may still add other well-known, realistic points of interest.
9. Every item must have a start time before its end time, in 24-hour HH:MM format.
10. Output must match this exact JSON schema (no extra top-level keys):
{
  "summary": "string, 1-3 sentence overview of the whole trip",
  "estimatedTotalCost": number or null,
  "importantNotes": ["string", ...],
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "string",
      "summary": "string",
      "estimatedDailyCost": number or null,
      "items": [
        {
          "sequence": 1,
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "itemType": "breakfast|sightseeing|activity|travel|lunch|rest|check_in|check_out|shopping|snack|dinner|nightlife|free_time",
          "title": "string",
          "description": "string",
          "placeName": "string or null",
          "address": "string or null",
          "latitude": number or null,
          "longitude": number or null,
          "estimatedDurationMinutes": number or null,
          "estimatedTravelMinutes": number or null,
          "estimatedCost": number or null,
          "mapsUrl": "string or null",
          "notes": "string or null"
        }
      ]
    }
  ]
}"""


def _build_user_prompt(trip: dict, verified_places: list, feedback: str = None) -> str:
    dates = trip_dates(trip["startDate"], trip["endDate"])
    payload = {
        "destination": trip.get("destination"),
        "startingCity": trip.get("startingCity"),
        "tripDates": dates,
        "numberOfDays": len(dates),
        "numberOfTravelers": trip.get("travelersCount"),
        "travelType": trip.get("travelType"),
        "budgetType": trip.get("budgetType"),
        "budgetAmount": trip.get("budgetAmount"),
        "currency": trip.get("currency", "INR"),
        "interests": trip.get("interests", []),
        "foodPreferences": trip.get("foodPreferences", []),
        "dietaryRestrictions": trip.get("dietaryRestrictions"),
        "preferredPace": trip.get("preferredPace") or "balanced",
        "arrivalDate": trip.get("arrivalDate"),
        "arrivalTime": trip.get("arrivalTime"),
        "departureDate": trip.get("departureDate"),
        "departureTime": trip.get("departureTime"),
        "travelMode": trip.get("travelMode"),
        "accommodationPreference": trip.get("accommodationPreference"),
        "hotelLocation": trip.get("hotelLocation"),
        "accessibilityRequirements": trip.get("accessibilityRequirements"),
        "specialRequests": trip.get("specialRequests"),
        "verifiedPlaces": verified_places[:40],
    }
    prompt = "Plan this trip:\n" + json.dumps(payload, ensure_ascii=False)
    if feedback:
        prompt += (
            "\n\nYour previous attempt was rejected for these reasons — fix them and "
            "return a corrected JSON object only:\n" + "\n".join(f"- {e}" for e in feedback)
        )
    return prompt


def generate_itinerary(trip: dict) -> dict:
    """
    Runs the full pipeline for `trip` (a trip Mongo document) and returns a
    normalized itinerary dict (see itinerary_validator.validate_itinerary).
    Raises ai_provider.AIProviderError or ItineraryValidationError if the
    itinerary could not be produced after one retry — callers should catch
    both and mark the trip as failed with a safe message.
    """
    verified_places = places_provider.search_places(
        trip.get("destination", ""), trip.get("interests", [])
    )

    user_prompt = _build_user_prompt(trip, verified_places)
    raw_text = ai_provider.generate_json(SYSTEM_PROMPT, user_prompt)
    parsed = _safe_json_loads(raw_text)

    try:
        normalized = validate_itinerary(parsed, trip)
        normalized["placesVerified"] = bool(verified_places)
        return normalized
    except ItineraryValidationError as first_error:
        logger.warning("Itinerary validation failed, retrying once: %s", first_error.errors)
        retry_prompt = _build_user_prompt(trip, verified_places, feedback=first_error.errors)
        raw_text_2 = ai_provider.generate_json(SYSTEM_PROMPT, retry_prompt)
        parsed_2 = _safe_json_loads(raw_text_2)
        normalized = validate_itinerary(parsed_2, trip)
        normalized["placesVerified"] = bool(verified_places)
        return normalized


def _safe_json_loads(text: str) -> dict:
    text = (text or "").strip()
    # Some models wrap JSON in ```json fences even when asked not to — strip defensively.
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ItineraryValidationError([f"Response was not valid JSON: {exc}"])
