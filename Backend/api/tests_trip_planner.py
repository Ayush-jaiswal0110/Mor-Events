"""
tests_trip_planner.py — automated tests for the Plan My Trip feature.

Run with:  python manage.py test api.tests_trip_planner

No real network calls are made: the AI provider, places provider, Mongo
collections and outbound email are all replaced with fakes/mocks, per
Phase 20 ("Do not make paid API calls in unit tests").

NOTE: this file was written and reviewed carefully, but this session's
sandbox could not run `python manage.py test` (see the final report) — please
run it once locally/in CI to confirm.
"""
import json
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .trip_utils import (
    validate_trip_payload, ValidationError, generate_share_token,
)
from .services.itinerary_validator import validate_itinerary, ItineraryValidationError
from .utils import generate_token


class FakeCollection:
    """A minimal in-memory stand-in for a PyMongo Collection, just enough
    surface area for the trip planner views/services to run against."""

    def __init__(self):
        self.docs = {}

    def insert_one(self, doc):
        self.docs[doc["_id"]] = dict(doc)

    def find_one(self, query):
        for doc in self.docs.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        results = [dict(d) for d in self.docs.values() if self._matches(d, query)]
        if projection:
            excluded = [k for k, v in projection.items() if v == 0]
            for r in results:
                for k in excluded:
                    r.pop(k, None)
        return FakeCursor(results)

    def count_documents(self, query=None):
        query = query or {}
        return sum(1 for d in self.docs.values() if self._matches(d, query))

    def update_one(self, query, update):
        for doc in self.docs.values():
            if self._matches(doc, query):
                self._apply(doc, update)
                return FakeResult(matched_count=1)
        return FakeResult(matched_count=0)

    def update_many(self, query, update):
        count = 0
        for doc in self.docs.values():
            if self._matches(doc, query):
                self._apply(doc, update)
                count += 1
        return FakeResult(matched_count=count)

    def delete_one(self, query):
        for _id, doc in list(self.docs.items()):
            if self._matches(doc, query):
                del self.docs[_id]
                return FakeResult(deleted_count=1)
        return FakeResult(deleted_count=0)

    def delete_many(self, query):
        count = 0
        for _id, doc in list(self.docs.items()):
            if self._matches(doc, query):
                del self.docs[_id]
                count += 1
        return FakeResult(deleted_count=count)

    def find_one_and_update(self, query, update, upsert=False, return_document=True):
        doc = self.find_one(query)
        if not doc and upsert:
            doc = dict(query.get("_id") and {"_id": query["_id"]} or {})
            self.docs[doc.get("_id", "generated")] = doc
        if doc:
            self._apply(self.docs[doc["_id"]], update)
            return dict(self.docs[doc["_id"]])
        return None

    def create_index(self, *args, **kwargs):
        return "fake-index"

    @staticmethod
    def _matches(doc, query):
        for key, value in query.items():
            if isinstance(value, dict) and "$regex" in value:
                if value["$regex"].lower() not in str(doc.get(key, "")).lower():
                    return False
            elif doc.get(key) != value:
                return False
        return True

    @staticmethod
    def _apply(doc, update):
        if "$set" in update:
            doc.update(update["$set"])
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v
        if "$setOnInsert" in update and len(doc) <= 1:
            doc.update(update["$setOnInsert"])


class FakeCursor:
    def __init__(self, results):
        self.results = results

    def sort(self, *args, **kwargs):
        return self

    def skip(self, n):
        self.results = self.results[n:]
        return self

    def limit(self, n):
        self.results = self.results[:n]
        return self

    def __iter__(self):
        return iter(self.results)


class FakeResult:
    def __init__(self, matched_count=0, deleted_count=0):
        self.matched_count = matched_count
        self.deleted_count = deleted_count


SAMPLE_TRIP_INPUT = {
    "destination": "Jaipur",
    "startDate": "2026-09-10",
    "endDate": "2026-09-12",
    "travelersCount": 2,
    "travelType": "couple",
    "budgetType": "moderate",
    "interests": ["history", "food"],
    "foodPreferences": ["local_food"],
    "preferredPace": "balanced",
}


class TripValidationTests(TestCase):
    def test_valid_payload_is_accepted(self):
        cleaned = validate_trip_payload(SAMPLE_TRIP_INPUT)
        self.assertEqual(cleaned["destination"], "Jaipur")
        self.assertEqual(cleaned["travelersCount"], 2)

    def test_missing_destination_is_rejected(self):
        data = dict(SAMPLE_TRIP_INPUT)
        data.pop("destination")
        with self.assertRaises(ValidationError) as ctx:
            validate_trip_payload(data)
        self.assertTrue(any(e["field"] == "destination" for e in ctx.exception.errors))

    def test_end_date_before_start_date_is_rejected(self):
        data = dict(SAMPLE_TRIP_INPUT)
        data["endDate"] = "2026-09-01"
        with self.assertRaises(ValidationError) as ctx:
            validate_trip_payload(data)
        self.assertTrue(any(e["field"] == "endDate" for e in ctx.exception.errors))

    def test_travelers_count_must_be_at_least_one(self):
        data = dict(SAMPLE_TRIP_INPUT)
        data["travelersCount"] = 0
        with self.assertRaises(ValidationError):
            validate_trip_payload(data)

    def test_invalid_custom_budget_is_rejected(self):
        data = dict(SAMPLE_TRIP_INPUT)
        data["budgetType"] = "custom"
        data["budgetAmount"] = "not-a-number"
        with self.assertRaises(ValidationError) as ctx:
            validate_trip_payload(data)
        self.assertTrue(any(e["field"] == "budgetAmount" for e in ctx.exception.errors))

    def test_unknown_interest_is_rejected(self):
        data = dict(SAMPLE_TRIP_INPUT)
        data["interests"] = ["skydiving_on_the_moon"]
        with self.assertRaises(ValidationError):
            validate_trip_payload(data)

    def test_partial_update_only_validates_supplied_fields(self):
        cleaned = validate_trip_payload({"specialRequests": "window seat please"}, partial=True)
        self.assertEqual(cleaned, {"specialRequests": "window seat please"})


class ItineraryValidatorTests(TestCase):
    def setUp(self):
        self.trip = {"startDate": "2026-09-10", "endDate": "2026-09-11"}

    def test_valid_itinerary_passes(self):
        raw = {
            "summary": "A short cultural trip.",
            "estimatedTotalCost": 5000,
            "importantNotes": ["Carry a valid ID."],
            "days": [
                {
                    "dayNumber": 1, "date": "2026-09-10", "title": "Arrival",
                    "summary": "Settle in and explore.",
                    "items": [
                        {"sequence": 1, "startTime": "08:00", "endTime": "09:00", "itemType": "breakfast", "title": "Breakfast at hotel"},
                        {"sequence": 2, "startTime": "10:00", "endTime": "12:00", "itemType": "sightseeing", "title": "City Palace"},
                    ],
                },
                {
                    "dayNumber": 2, "date": "2026-09-11", "title": "Departure",
                    "summary": "Last day.",
                    "items": [
                        {"sequence": 1, "startTime": "09:00", "endTime": "10:00", "itemType": "breakfast", "title": "Breakfast"},
                    ],
                },
            ],
        }
        result = validate_itinerary(raw, self.trip)
        self.assertEqual(len(result["itineraryDays"]), 2)
        self.assertEqual(result["itineraryDays"][0]["dayNumber"], 1)

    def test_wrong_number_of_days_is_rejected(self):
        raw = {"days": [{"dayNumber": 1, "date": "2026-09-10", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "08:00", "endTime": "09:00"}]}]}
        with self.assertRaises(ItineraryValidationError):
            validate_itinerary(raw, self.trip)

    def test_invalid_item_type_is_rejected(self):
        raw = {
            "days": [
                {"dayNumber": 1, "date": "2026-09-10", "items": [{"sequence": 1, "itemType": "skydiving", "title": "x", "startTime": "08:00", "endTime": "09:00"}]},
                {"dayNumber": 2, "date": "2026-09-11", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "08:00", "endTime": "09:00"}]},
            ]
        }
        with self.assertRaises(ItineraryValidationError):
            validate_itinerary(raw, self.trip)

    def test_end_time_before_start_time_is_rejected(self):
        raw = {
            "days": [
                {"dayNumber": 1, "date": "2026-09-10", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "10:00", "endTime": "09:00"}]},
                {"dayNumber": 2, "date": "2026-09-11", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "08:00", "endTime": "09:00"}]},
            ]
        }
        with self.assertRaises(ItineraryValidationError):
            validate_itinerary(raw, self.trip)

    def test_never_trusts_ai_supplied_booking_url(self):
        raw = {
            "days": [
                {"dayNumber": 1, "date": "2026-09-10", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "08:00", "endTime": "09:00", "bookingUrl": "https://example.com/booked"}]},
                {"dayNumber": 2, "date": "2026-09-11", "items": [{"sequence": 1, "itemType": "breakfast", "title": "x", "startTime": "08:00", "endTime": "09:00"}]},
            ]
        }
        result = validate_itinerary(raw, self.trip)
        self.assertIsNone(result["itineraryDays"][0]["items"][0]["bookingUrl"])


class TripApiTests(TestCase):
    """Exercises the views with the real Mongo collections monkeypatched out."""

    def setUp(self):
        self.trips = FakeCollection()
        self.shares = FakeCollection()
        self.rate_limits = FakeCollection()
        self.users = FakeCollection()

        patches = [
            patch("api.trip_views.trips_collection", self.trips),
            patch("api.trip_share_views.trips_collection", self.trips),
            patch("api.trip_share_views.trip_shares_collection", self.shares),
            patch("api.trip_utils.rate_limits_collection", self.rate_limits),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

        self.client = APIClient()
        self.user_id = "user_test123"
        self.token = generate_token(self.user_id, "traveler@example.com", role="user")
        self.other_token = generate_token("user_other", "other@example.com", role="user")

    def auth(self, token=None):
        return {"HTTP_AUTHORIZATION": f"Bearer {token or self.token}"}

    def test_create_trip_requires_auth(self):
        resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json")
        self.assertEqual(resp.status_code, 401)

    @patch("api.trip_views.queue_generation")
    def test_create_trip_success(self, mock_queue):
        resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["destination"], "Jaipur")
        self.assertEqual(body["data"]["status"], "queued")
        mock_queue.assert_called_once()

    def test_create_trip_validation_error(self):
        bad = dict(SAMPLE_TRIP_INPUT)
        bad["endDate"] = "2020-01-01"
        resp = self.client.post("/api/trips", bad, format="json", **self.auth())
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(resp.json()["success"])

    @patch("api.trip_views.queue_generation")
    def test_user_cannot_access_another_users_trip(self, mock_queue):
        create_resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        trip_id = create_resp.json()["data"]["id"]

        resp = self.client.get(f"/api/trips/{trip_id}", **self.auth(self.other_token))
        self.assertEqual(resp.status_code, 404)

        own_resp = self.client.get(f"/api/trips/{trip_id}", **self.auth())
        self.assertEqual(own_resp.status_code, 200)

    @patch("api.trip_views.queue_generation")
    def test_delete_trip_removes_it(self, mock_queue):
        create_resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        trip_id = create_resp.json()["data"]["id"]

        del_resp = self.client.delete(f"/api/trips/{trip_id}", **self.auth())
        self.assertEqual(del_resp.status_code, 200)

        get_resp = self.client.get(f"/api/trips/{trip_id}", **self.auth())
        self.assertEqual(get_resp.status_code, 404)

    @patch("api.trip_views.queue_generation")
    def test_generation_rate_limit_enforced(self, mock_queue):
        with patch("api.trip_views.TRIP_GENERATION_LIMIT_PER_DAY", 1):
            first = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
            self.assertEqual(first.json()["data"]["status"], "queued")

            second = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
            # Second trip today should be saved as a draft rather than generated.
            self.assertEqual(second.json()["data"]["status"], "draft")

    @patch("api.trip_views.queue_generation")
    def test_share_email_requires_completed_trip(self, mock_queue):
        create_resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        trip_id = create_resp.json()["data"]["id"]

        resp = self.client.post(
            f"/api/trips/{trip_id}/share",
            {"recipientEmail": "friend@example.com"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(resp.status_code, 400)

    @patch("api.trip_share_views.send_trip_share_email", return_value=True)
    @patch("api.trip_views.queue_generation")
    def test_share_email_success_once_completed(self, mock_queue, mock_send):
        create_resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        trip_id = create_resp.json()["data"]["id"]
        self.trips.update_one({"_id": trip_id}, {"$set": {"status": "completed"}})

        resp = self.client.post(
            f"/api/trips/{trip_id}/share",
            {"recipientEmail": "friend@example.com", "recipientName": "Friend"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(resp.status_code, 202)
        self.assertEqual(self.shares.count_documents({"tripId": trip_id}), 1)

    def test_share_email_invalid_address_rejected(self):
        resp = self.client.post(
            "/api/trips/trip_doesnotexist/share",
            {"recipientEmail": "not-an-email"},
            format="json",
            **self.auth(),
        )
        # Ownership check runs first (trip doesn't exist) — still must not be a 500.
        self.assertIn(resp.status_code, (400, 404))

    @patch("api.trip_views.queue_generation")
    def test_share_link_revocation(self, mock_queue):
        create_resp = self.client.post("/api/trips", SAMPLE_TRIP_INPUT, format="json", **self.auth())
        trip_id = create_resp.json()["data"]["id"]
        self.trips.update_one({"_id": trip_id}, {"$set": {"status": "completed"}})

        link_resp = self.client.post(f"/api/trips/{trip_id}/share-link", **self.auth())
        self.assertEqual(link_resp.status_code, 201)
        share_id = link_resp.json()["data"]["id"]

        revoke_resp = self.client.post(f"/api/trips/{trip_id}/shares/{share_id}/revoke", **self.auth())
        self.assertEqual(revoke_resp.status_code, 200)

        share_doc = self.shares.find_one({"_id": share_id})
        self.assertTrue(share_doc["revoked"])

    def test_public_shared_trip_endpoint_rejects_unknown_token(self):
        resp = self.client.get("/api/shared-trips/not-a-real-token")
        self.assertEqual(resp.status_code, 404)


class ShareTokenTests(TestCase):
    def test_share_token_is_reasonably_long_and_unique(self):
        tokens = {generate_share_token() for _ in range(50)}
        self.assertEqual(len(tokens), 50)
        self.assertTrue(all(len(t) >= 32 for t in tokens))
