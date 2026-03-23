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
