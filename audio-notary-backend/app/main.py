from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, analyze

app = FastAPI()

# --- THE NUCLEAR FIX ---
# We use regex='.*' to allow ANY origin (Mobile, Vercel, Localhost)
# This overrides the strict blocking that is failing on your phone.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Audio Notary Backend is Live on Hugging Face!"}

# Register Routes
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])