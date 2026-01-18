from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Story Schemas for Client
class StoryCreate(BaseModel):
    """Schema for creating a new story (client-side)"""
    destination: str = Field(..., max_length=200)
    what_happened: str
    interesting_things: Optional[str] = None
    pictures: Optional[List[str]] = None
    artifact: Optional[str] = Field(None, max_length=200)
    emotion: Optional[str] = Field(None, max_length=50)


class StoryUpdate(BaseModel):
    """Schema for updating a story (client-side, only if pending)"""
    destination: Optional[str] = Field(None, max_length=200)
    what_happened: Optional[str] = None
    interesting_things: Optional[str] = None
    pictures: Optional[List[str]] = None
    artifact: Optional[str] = Field(None, max_length=200)
    emotion: Optional[str] = Field(None, max_length=50)


class StoryResponse(BaseModel):
    """Schema for story response (includes status)"""
    id: UUID
    customer_id: UUID
    destination: str
    what_happened: str
    interesting_things: Optional[str]
    pictures: Optional[List[str]]
    artifact: Optional[str]
    emotion: Optional[str]
    status: str  # pending, published, rejected
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Customer Schemas for Client
class CustomerUpdate(BaseModel):
    """Schema for updating own customer profile"""
    name: Optional[str] = Field(None, max_length=100)
    personality_traits: Optional[str] = None
    visual_description: Optional[str] = None


class CustomerResponse(BaseModel):
    """Schema for customer response"""
    id: UUID
    name: str
    personality_traits: Optional[str]
    visual_description: Optional[str]
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerWithStories(CustomerResponse):
    """Customer response with associated stories"""
    stories: List[StoryResponse] = []

