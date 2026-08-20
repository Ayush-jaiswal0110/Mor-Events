"""
places_provider.py — provider abstraction for verified place/attraction
data, kept out of views per the "no external API logic in views" rule.

Default provider: Geoapify (PLACES_PROVIDER=geoapify). Chosen because it has
solid India coverage, a free tier, a single REST call for geocoding +
places + routing (no separate SDKs needed — everything goes over
`requests`, already a dependency), and does not require a billing-enabled
Google Cloud project like Google Places would.

If no provider is configured (no API key), every function degrades
gracefully to an empty result instead of raising — the AI itinerary
generator falls back to using its own general knowledge of the destination
and the itinerary is flagged as not place-verified. This keeps the feature
usable out of the box even before an operator has added a places API key.
"""
import os
import logging

import requests

logger = logging.getLogger(__name__)

PLACES_PROVIDER = os.getenv("PLACES_PROVIDER", "geoapify").lower()
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "")
REQUEST_TIMEOUT = 15

# Cache geocoding/place lookups in-process for the lifetime of the worker to
# cut down on repeat calls for popular destinations. Kept intentionally
# simple (no Redis dependency); safe because this is public, non-user data.
_geocode_cache = {}


def is_configured() -> bool:
    return PLACES_PROVIDER == "geoapify" and bool(GEOAPIFY_API_KEY)


def geocode_destination(destination: str):
    """Returns {"lat", "lon", "country", "formatted"} or None."""
    if not destination:
        return None
    if destination in _geocode_cache:
        return _geocode_cache[destination]
    if not is_configured():
        return None
    try:
        resp = requests.get(
            "https://api.geoapify.com/v1/geocode/search",
            params={"text": destination, "limit": 1, "apiKey": GEOAPIFY_API_KEY},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        features = resp.json().get("features", [])
        if not features:
            return None
        props = features[0].get("properties", {})
        result = {
            "lat": props.get("lat"),
            "lon": props.get("lon"),
            "country": props.get("country"),
            "formatted": props.get("formatted"),
        }
        _geocode_cache[destination] = result
        return result
    except requests.RequestException as exc:
        logger.warning("Geocoding failed for %s: %s", destination, exc)
        return None


CATEGORY_MAP = {
    "nature": "natural",
    "adventure": "sport",
    "culture": "entertainment.culture",
    "history": "heritage",
    "museums": "entertainment.museum",
    "religious_places": "religion",
    "food": "catering.restaurant",
    "shopping": "commercial.shopping_mall",
    "nightlife": "entertainment.nightclub",
    "beaches": "beach",
    "mountains": "natural.mountain",
    "wildlife": "national_park",
    "photography": "tourism.sights",
    "relaxation": "leisure.spa",
    "local_experiences": "tourism.attraction",
    "family_activities": "entertainment",
}


def search_places(destination: str, interests: list = None, limit: int = 25):
    """
    Returns a list of verified place dicts:
    {name, category, address, lat, lon, place_id, opening_hours, url}
    Returns [] if the provider isn't configured or the destination can't be
    geocoded — callers must treat that as "no verified data available", not
    as an error.
    """
    if not is_configured():
        return []

    location = geocode_destination(destination)
    if not location or location.get("lat") is None:
        return []

    categories = set()
    for interest in (interests or []):
        cat = CATEGORY_MAP.get(interest)
        if cat:
            categories.add(cat)
    if not categories:
        categories = {"tourism.sights", "catering.restaurant"}

    try:
        resp = requests.get(
            "https://api.geoapify.com/v2/places",
            params={
                "categories": ",".join(categories),
                "filter": f"circle:{location['lon']},{location['lat']},15000",
                "bias": f"proximity:{location['lon']},{location['lat']}",
                "limit": limit,
                "apiKey": GEOAPIFY_API_KEY,
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        features = resp.json().get("features", [])
    except requests.RequestException as exc:
        logger.warning("Places search failed for %s: %s", destination, exc)
        return []

    places = []
    for feature in features:
        props = feature.get("properties", {})
        places.append({
            "name": props.get("name") or props.get("address_line1"),
            "category": (props.get("categories") or [None])[0],
            "address": props.get("formatted"),
            "lat": props.get("lat"),
            "lon": props.get("lon"),
            "place_id": props.get("place_id"),
            "opening_hours": props.get("opening_hours"),
            "url": props.get("website") or props.get("datasource", {}).get("raw", {}).get("website"),
        })
    return [p for p in places if p.get("name")]


def maps_url(place: dict) -> str:
    if place.get("lat") is not None and place.get("lon") is not None:
        return f"https://www.google.com/maps/search/?api=1&query={place['lat']},{place['lon']}"
    if place.get("name"):
        from urllib.parse import quote
        return f"https://www.google.com/maps/search/?api=1&query={quote(place['name'])}"
    return ""
