from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.db.models import Story, Customer
from app.schemas.client import (
    StoryCreate,
    StoryUpdate,
    StoryResponse,
    CustomerUpdate,
    CustomerResponse,
    CustomerWithStories
)
from app.auth.dependencies import get_current_user, get_current_customer

router = APIRouter(prefix="/api/client", tags=["client"])


# Story Endpoints (Client-side)
@router.post("/story", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
async def create_story(
    story: StoryCreate,
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Create a new travel story (client-side).
    Story is created with status='pending' and requires admin approval.
    """
    # Create story with pending status
    db_story = Story(
        customer_id=current_user.id,
        destination=story.destination,
        what_happened=story.what_happened,
        interesting_things=story.interesting_things,
        pictures=story.pictures,
        artifact=story.artifact,
        emotion=story.emotion,
        status="pending"  # Always starts as pending
    )
    
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.get("/stories", response_model=List[StoryResponse])
async def get_my_stories(
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get all stories for the current user's customer.
    Returns stories with any status (pending, published, rejected).
    """
    stories = db.query(Story).filter(
        Story.customer_id == current_user.id
    ).order_by(Story.created_at.desc()).all()
    
    return stories


@router.get("/stories/published", response_model=List[StoryResponse])
async def get_published_stories(
    db: Session = Depends(get_db)
):
    """
    Get all published stories (for browsing).
    No authentication required, but can be used by authenticated users.
    """
    stories = db.query(Story).filter(
        Story.status == "published"
    ).order_by(Story.created_at.desc()).all()
    
    return stories


@router.get("/story/{story_id}", response_model=StoryResponse)
async def get_my_story(
    story_id: UUID,
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get a specific story if it belongs to the current user.
    """
    story = db.query(Story).filter(
        Story.id == story_id,
        Story.customer_id == current_user.id
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found or you don't have access to it"
        )
    
    return story


@router.put("/story/{story_id}", response_model=StoryResponse)
async def update_my_story(
    story_id: UUID,
    story_update: StoryUpdate,
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Update a story (only if status is 'pending' or 'rejected').
    Cannot update published stories.
    """
    db_story = db.query(Story).filter(
        Story.id == story_id,
        Story.customer_id == current_user.id
    ).first()
    
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found or you don't have access to it"
        )
    
    # Only allow updates if story is pending or rejected
    if db_story.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update published stories. Contact admin for changes."
        )
    
    # Update only provided fields
    update_data = story_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_story, field, value)
    
    # If updating a rejected story, set back to pending
    if db_story.status == "rejected":
        db_story.status = "pending"
    
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.delete("/story/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_story(
    story_id: UUID,
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Delete a story (only if status is 'pending' or 'rejected').
    Cannot delete published stories.
    """
    db_story = db.query(Story).filter(
        Story.id == story_id,
        Story.customer_id == current_user.id
    ).first()
    
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found or you don't have access to it"
        )
    
    # Only allow deletion if story is pending or rejected
    if db_story.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete published stories. Contact admin for removal."
        )
    
    db.delete(db_story)
    db.commit()
    
    return None


# Customer Endpoints (Client-side)
@router.get("/customer", response_model=CustomerResponse)
async def get_my_customer(
    current_user: Customer = Depends(get_current_customer)
):
    """
    Get the current user's customer profile.
    """
    return current_user


@router.get("/customer/with-stories", response_model=CustomerWithStories)
async def get_my_customer_with_stories(
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Get the current user's customer profile with all their stories.
    """
    # Load stories
    stories = db.query(Story).filter(
        Story.customer_id == current_user.id
    ).order_by(Story.created_at.desc()).all()
    
    customer_dict = {
        "id": current_user.id,
        "name": current_user.name,
        "personality_traits": current_user.personality_traits,
        "visual_description": current_user.visual_description,
        "user_id": current_user.user_id,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
        "stories": stories
    }
    
    return customer_dict


@router.put("/customer", response_model=CustomerResponse)
async def update_my_customer(
    customer_update: CustomerUpdate,
    current_user: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Update the current user's customer profile.
    """
    # Update only provided fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

