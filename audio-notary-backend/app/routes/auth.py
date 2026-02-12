from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import timedelta, datetime
from app.database import users_collection
# Import tools from our new 'Security Guard' file
from app.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# --- MODELS (Defined here for simplicity) ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    username: str

# --- ROUTES ---

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "role": "user",
        "created_at": datetime.utcnow()
    }
    users_collection.insert_one(user_dict)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": "user"}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_type": "user", "username": user.username}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["email"], "role": db_user["role"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_type": "user", "username": db_user["username"]}

@router.post("/guest-login", response_model=Token)
async def guest_login():
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "guest_user", "role": "guest"},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_type": "guest", "username": "Guest User"}