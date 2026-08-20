"""
setup_trip_indexes.py — the Mongo-native equivalent of a Django migration
for the "Plan My Trip" feature.

This project stores all real data in MongoDB via raw PyMongo rather than
the Django ORM (see `backend_core/settings.py` — the sqlite `DATABASES`
entry only exists to keep `django.contrib.admin`/`auth` happy). There is
nothing for `makemigrations`/`migrate` to do for this feature's data, so
instead we ship an idempotent index-setup command — the closest equivalent
to "run the migration" in a Mongo-first codebase. Safe to run multiple
times (`create_index` is a no-op if the index already exists with the same
spec).

Usage:
    python manage.py setup_trip_indexes
"""
from django.core.management.base import BaseCommand

from api.database import (
    users_collection,
    trips_collection,
    trip_shares_collection,
    rate_limits_collection,
)


class Command(BaseCommand):
    help = "Create MongoDB indexes required by the Plan My Trip feature (idempotent)."

    def handle(self, *args, **options):
        users_collection.create_index("googleSub", unique=True, sparse=True)
        users_collection.create_index("email", unique=True)
        self.stdout.write(self.style.SUCCESS("users indexes ready"))

        trips_collection.create_index([("userId", 1), ("createdAt", -1)])
        trips_collection.create_index([("userId", 1), ("status", 1)])
        self.stdout.write(self.style.SUCCESS("trips indexes ready"))

        trip_shares_collection.create_index("shareToken", unique=True)
        trip_shares_collection.create_index([("tripId", 1), ("createdAt", -1)])
        self.stdout.write(self.style.SUCCESS("trip_shares indexes ready"))

        # TTL-style cleanup is intentionally not enabled by default since
        # rate-limit documents double as a lightweight audit trail; add a
        # TTL index here if automatic expiry becomes desirable.
        rate_limits_collection.create_index("createdAt")
        self.stdout.write(self.style.SUCCESS("rate_limits indexes ready"))

        self.stdout.write(self.style.SUCCESS("All Plan My Trip indexes are set up."))
