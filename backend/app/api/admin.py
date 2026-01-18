from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID

from app.db.database import get_db
from app.db.models import Story, Customer, User
from app.schemas.admin import (
    StoryUpdate,
    StoryResponse,
    StoryStatusUpdate,
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerWithStories,
    UserResponse
)
from app.auth.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


# Story Endpoints (Admin Only)
@router.get("/stories", response_model=List[StoryResponse])
async def get_all_stories(
    status: Optional[str] = Query(None, description="Filter by status: pending, published, rejected"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all stories with optional filters (admin only).
    Query params: status (pending/published/rejected), customer_id
    """
    query = db.query(Story)
    
    if status:
        if status not in ["pending", "published", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be one of: pending, published, rejected"
            )
        query = query.filter(Story.status == status)
    
    if customer_id:
        query = query.filter(Story.customer_id == customer_id)
    
    stories = query.order_by(Story.created_at.desc()).all()
    return stories


@router.get("/stories/{customer_id}", response_model=List[StoryResponse])
async def get_stories_by_customer(
    customer_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all stories for a specific customer (admin only)"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    
    stories = db.query(Story).filter(Story.customer_id == customer_id).order_by(Story.created_at.desc()).all()
    return stories


@router.get("/story/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific story by ID (admin only)"""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found"
        )
    return story


@router.put("/story/{story_id}", response_model=StoryResponse)
async def update_story(
    story_id: UUID,
    story_update: StoryUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update any story (admin only)"""
    db_story = db.query(Story).filter(Story.id == story_id).first()
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found"
        )
    
    # Update only provided fields
    update_data = story_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_story, field, value)
    
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.post("/story/{story_id}/approve", response_model=StoryResponse)
async def approve_story(
    story_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve and publish a story (admin only)"""
    db_story = db.query(Story).filter(Story.id == story_id).first()
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found"
        )
    
    if db_story.status == "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Story is already published"
        )
    
    db_story.status = "published"
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.post("/story/{story_id}/reject", response_model=StoryResponse)
async def reject_story(
    story_id: UUID,
    status_update: Optional[StoryStatusUpdate] = None,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a story (admin only)"""
    db_story = db.query(Story).filter(Story.id == story_id).first()
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found"
        )
    
    db_story.status = "rejected"
    # Could store rejection_reason in a separate field if needed
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.delete("/story/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(
    story_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete any story (admin only)"""
    db_story = db.query(Story).filter(Story.id == story_id).first()
    if not db_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story with id {story_id} not found"
        )
    
    db.delete(db_story)
    db.commit()
    
    return None


# Customer Endpoints (Admin Only)
@router.post("/customer", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer: CustomerCreate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new customer (NPC)"""
    # Verify user exists
    user = db.query(User).filter(User.id == customer.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {customer.user_id} not found"
        )
    
    # Check if user already has a customer
    existing_customer = db.query(Customer).filter(Customer.user_id == customer.user_id).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with id {customer.user_id} already has a customer profile"
        )
    
    # Create customer
    db_customer = Customer(
        user_id=customer.user_id,
        name=customer.name,
        personality_traits=customer.personality_traits,
        visual_description=customer.visual_description
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.get("/customers", response_model=List[CustomerResponse])
async def get_all_customers(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all customers (admin only)"""
    customers = db.query(Customer).order_by(Customer.created_at.desc()).all()
    return customers


@router.get("/customer/{customer_id}", response_model=CustomerWithStories)
async def get_customer(
    customer_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific customer with their stories (admin only)"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    
    # Load stories
    stories = db.query(Story).filter(Story.customer_id == customer_id).order_by(Story.created_at.desc()).all()
    
    customer_dict = {
        "id": customer.id,
        "name": customer.name,
        "personality_traits": customer.personality_traits,
        "visual_description": customer.visual_description,
        "user_id": customer.user_id,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "stories": stories
    }
    
    return customer_dict


@router.put("/customer/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_update: CustomerUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update any customer (admin only)"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    
    # Update only provided fields
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.delete("/customer/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: UUID,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a customer (will cascade delete stories and interactions) (admin only)"""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    
    db.delete(db_customer)
    db.commit()
    
    return None

