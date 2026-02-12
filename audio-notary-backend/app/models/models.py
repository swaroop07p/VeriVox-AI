from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "user" or "guest"
    username: str

class AudioAnalysisRequest(BaseModel):
    filename: str
    # Frontend will send file, this model is for response structure mainly