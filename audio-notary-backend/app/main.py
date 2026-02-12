from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, analyze
import os

app = FastAPI()

# --- CORS CONFIGURATION (ALLOW ALL) ---
# Temporarily allow all origins to fix the blocking issue.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Allow ANY website
    allow_credentials=True, # Allow Tokens/Cookies
    allow_methods=["*"],    # Allow GET, POST, OPTIONS
    allow_headers=["*"],    # Allow Authorization header
)

@app.get("/")
def read_root():
    return {"message": "Audio Notary Backend is Running"}

# Register Routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])