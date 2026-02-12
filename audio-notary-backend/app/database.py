from pymongo import MongoClient
import os
from dotenv import load_dotenv

# 1. Load Environment Variables from .env file
load_dotenv()

# 2. Get Mongo URI (Cloud first, then Local)
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("⚠️  WARNING: MONGO_URI not found in .env, using localhost...")
    MONGO_URI = "mongodb://localhost:27017"

# 3. Initialize Client
try:
    client = MongoClient(MONGO_URI)
    # Test the connection immediately
    client.admin.command('ping')
    print("✅ MongoDB Atlas Connected Successfully!")
except Exception as e:
    print(f"❌ MongoDB Connection Failed: {e}")

# 4. Select Database
db = client["audio_notary"]

# 5. Define Collections
users_collection = db["users"]
reports_collection = db["reports"]