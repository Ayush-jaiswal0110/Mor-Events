import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
# Connect to the specific database
client = MongoClient(MONGO_URI)
db = client.get_database("mor_events") 

def get_db():
    return db

events_collection = db["events"]
registrations_collection = db["registrations"]
reviews_collection = db["reviews"]
integration_setting_collection = db["integration_settings"]
members_collection = db["members"]

# --- Trip Planner collections (added for the "Plan My Trip" feature) ---
# Consumer/traveler accounts created via Google Sign-In. Kept separate from
# `admin_users` (used only by the existing hardcoded admin login) so the
# existing admin auth flow is never touched.
users_collection = db["users"]

# One document per trip. Itinerary days/items are embedded as sub-documents
# (idiomatic for Mongo, and avoids needing a second relational database just
# for this feature) rather than living in separate collections.
trips_collection = db["trips"]

# One document per share attempt (email share or plain share-link).
trip_shares_collection = db["trip_shares"]

# Simple per-user/per-day counters used for trip generation / regeneration /
# email-share rate limiting. Avoids requiring Redis just for rate limiting.
rate_limits_collection = db["rate_limits"]

