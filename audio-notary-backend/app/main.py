from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, analyze

app = FastAPI()

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vercel to connect!
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