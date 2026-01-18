from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class UserRegister(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    # Optional customer profile fields (auto-created on registration)
    customer_name: Optional[str] = Field(None, max_length=100, description="Customer name (defaults to username if not provided)")
    personality_traits: Optional[str] = Field(None, description="Personality traits for the customer character")
    visual_description: Optional[str] = Field(None, description="Visual description of the customer character")


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    user_id: UUID
    username: str

