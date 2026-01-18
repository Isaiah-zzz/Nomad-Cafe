from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class ChatRequest(BaseModel):
    """Schema for chat request"""
    thread_id: str = Field(..., description="Unique session/thread identifier")
    character_id: UUID = Field(..., description="Customer/character UUID")
    message: str = Field(..., description="Player's message to the customer")
    is_fed: bool = Field(default=False, description="Whether the customer has been fed")


class ChatResponse(BaseModel):
    """Schema for chat response"""
    response: str = Field(..., description="AI customer's response message")
    artifact: Optional[str] = Field(None, description="Artifact mentioned in the story")
    story_id: Optional[str] = Field(None, description="UUID of the story being shared")
    thread_id: str = Field(..., description="Thread ID for continuing the conversation")
    is_fed: bool = Field(..., description="Current fed status")


class StatusRequest(BaseModel):
    """Schema for status check request"""
    thread_id: str = Field(..., description="Thread ID to check status for")


class StatusResponse(BaseModel):
    """Schema for status response"""
    thread_id: str
    customer_id: str
    is_fed: bool
    message_count: int
    last_updated: Optional[str] = None

