"""
itinerary_validator.py — validates raw AI JSON output before it is ever
saved to the database (Phase 10). Nothing from the AI response reaches
Mongo without passing through here first.
"""
import re
from datetime import datetime

from ..trip_utils import ITEM_TYPES, trip_dates

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class ItineraryValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(errors))


def _is_valid_time(value):
    return isinstance(value, str) and bool(TIME_RE.match(value))


def _is_valid_url(value):
    if value in (None, ""):
        return True
    return isinstance(value, str) and bool(URL_RE.match(value)) and len(value) < 2000


def _is_valid_cost(value):
    if value is None:
        return True
    try:
        return float(value) >= 0
    except (TypeError, ValueError):
        return False


def validate_itinerary(raw: dict, trip: dict) -> dict:
    """
    Validates `raw` (already-parsed JSON from the AI) against the trip's
    expected shape. Returns a normalized dict ready to store on the trip
    document, or raises ItineraryValidationError with a list of human
    readable problems (used to build the retry-with-feedback prompt).
    """
    errors = []
    if not isinstance(raw, dict):
        raise ItineraryValidationError(["Response was not a JSON object"])

    expected_dates = trip_dates(trip["startDate"], trip["endDate"])
    days_raw = raw.get("days")
    if not isinstance(days_raw, list):
        errors.append("Missing or invalid 'days' array")
        raise ItineraryValidationError(errors)

    if len(days_raw) != len(expected_dates):
        errors.append(
            f"Expected exactly {len(expected_dates)} day(s) for this trip, got {len(days_raw)}"
        )

    seen_day_numbers = set()
    normalized_days = []

    for idx, day in enumerate(days_raw):
        prefix = f"day[{idx}]"
        if not isinstance(day, dict):
            errors.append(f"{prefix}: not an object")
            continue

        day_number = day.get("dayNumber")
        if not isinstance(day_number, int) or day_number < 1:
            errors.append(f"{prefix}: invalid dayNumber")
            continue
        if day_number in seen_day_numbers:
            errors.append(f"{prefix}: duplicate dayNumber {day_number}")
            continue
        seen_day_numbers.add(day_number)

        expected_date = expected_dates[day_number - 1] if day_number - 1 < len(expected_dates) else None
        day_date = day.get("date")
        if expected_date and day_date != expected_date:
            errors.append(f"{prefix}: date '{day_date}' does not match trip date '{expected_date}' for day {day_number}")

        items_raw = day.get("items")
        if not isinstance(items_raw, list) or not items_raw:
            errors.append(f"{prefix}: 'items' must be a non-empty array")
            items_raw = []

        normalized_items = []
        seen_sequences = set()
        last_end_time = None
        for j, item in enumerate(items_raw):
            iprefix = f"{prefix}.items[{j}]"
            if not isinstance(item, dict):
                errors.append(f"{iprefix}: not an object")
                continue

            item_type = item.get("itemType")
            if item_type not in ITEM_TYPES:
                errors.append(f"{iprefix}: invalid itemType '{item_type}'")
                continue

            sequence = item.get("sequence")
            if not isinstance(sequence, int):
                sequence = j + 1
            if sequence in seen_sequences:
                errors.append(f"{iprefix}: duplicate sequence {sequence}")
            seen_sequences.add(sequence)

            start_time = item.get("startTime")
            end_time = item.get("endTime")
            if start_time is not None and not _is_valid_time(start_time):
                errors.append(f"{iprefix}: invalid startTime '{start_time}'")
            if end_time is not None and not _is_valid_time(end_time):
                errors.append(f"{iprefix}: invalid endTime '{end_time}'")
            if start_time and end_time and _is_valid_time(start_time) and _is_valid_time(end_time):
                if end_time < start_time:
                    errors.append(f"{iprefix}: endTime is before startTime")

            title = item.get("title")
            if not title or not isinstance(title, str):
                errors.append(f"{iprefix}: missing title")

            if not _is_valid_cost(item.get("estimatedCost")):
                errors.append(f"{iprefix}: invalid estimatedCost")
            if not _is_valid_url(item.get("mapsUrl")):
                errors.append(f"{iprefix}: invalid mapsUrl")
            if not _is_valid_url(item.get("bookingUrl")):
                errors.append(f"{iprefix}: invalid bookingUrl")

            normalized_items.append({
                "sequence": sequence,
                "startTime": start_time,
                "endTime": end_time,
                "itemType": item_type,
                "title": (title or "")[:150],
                "description": (item.get("description") or "")[:1000],
                "placeName": (item.get("placeName") or None),
                "providerPlaceId": item.get("providerPlaceId") or None,
                "address": item.get("address") or None,
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude"),
                "estimatedDurationMinutes": item.get("estimatedDurationMinutes"),
                "estimatedTravelMinutes": item.get("estimatedTravelMinutes"),
                "estimatedCost": item.get("estimatedCost"),
                "mapsUrl": item.get("mapsUrl") or None,
                "bookingUrl": None,  # Phase 9 rule 17: never claim a booking is completed/available.
                "notes": (item.get("notes") or None),
                "source": item.get("source") or "ai_estimate",
            })

        normalized_items.sort(key=lambda i: i["sequence"])
        normalized_days.append({
            "dayNumber": day_number,
            "date": day_date,
            "title": (day.get("title") or f"Day {day_number}")[:150],
            "summary": (day.get("summary") or "")[:1000],
            "estimatedDailyCost": day.get("estimatedDailyCost"),
            "items": normalized_items,
        })

    if errors:
        raise ItineraryValidationError(errors)

    normalized_days.sort(key=lambda d: d["dayNumber"])

    important_notes = raw.get("importantNotes")
    if not isinstance(important_notes, list):
        important_notes = []
    important_notes = [str(n)[:300] for n in important_notes][:20]

    estimated_total_cost = raw.get("estimatedTotalCost")
    if not _is_valid_cost(estimated_total_cost):
        estimated_total_cost = None

    return {
        "itineraryDays": normalized_days,
        "importantNotes": important_notes,
        "estimatedTotalCost": estimated_total_cost,
        "summary": (raw.get("summary") or "")[:1000],
    }
