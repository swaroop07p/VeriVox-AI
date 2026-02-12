import os
from pymongo import MongoClient
from dotenv import load_dotenv

print("Loading Environment Variables...") # DEBUG PRINT
load_dotenv()

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeyforhackathon123")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 3000
    MONGO_URL = os.getenv("MONGO_URL")

settings = Settings()

print(f"Connecting to MongoDB at: {settings.MONGO_URL[:20]}...") # DEBUG PRINT

try:
    # shorter timeout so it fails fast instead of hanging forever
    client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=5000)
    
    # Force a connection check
    client.server_info() 
    print("✅ MongoDB Connected Successfully!") # DEBUG PRINT
    
    db = client.audio_forensics_db
    users_collection = db.users
    reports_collection = db.reports

except Exception as e:
    print(f"❌ DATABASE ERROR: {e}")
    # We don't stop the app, so you can at least see the error
    db = None
    users_collection = None
    reports_collection = None