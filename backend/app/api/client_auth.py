from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.db.models import User, Customer
from app.schemas.auth import UserRegister, UserLogin, Token
from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password

router = APIRouter(prefix="/api/client/auth", tags=["client-authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new client user account.
    
    Automatically creates a customer profile for the user (each client account
    represents a customer in the game). Customer name defaults to username if
    not provided. Optional customer fields (personality_traits, visual_description)
    can be set during registration.
    
    Returns:
        JWT access token upon successful registration
    """
    # Check if username already exists
    existing_user = db.query(User).filter(
        or_(
            User.username == user_data.username,
            User.email == user_data.email
        )
    ).first()
    
    if existing_user:
        if existing_user.username == user_data.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user (client users are not admins)
    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Automatically create customer profile for the new user
    # Each client account represents a customer in the game
    new_customer = Customer(
        user_id=new_user.id,
        name=user_data.customer_name or user_data.username,  # Use username as default if name not provided
        personality_traits=user_data.personality_traits,
        visual_description=user_data.visual_description
    )
    
    db.add(new_customer)
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "username": new_user.username}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with username and password (client authentication).
    
    Returns:
        JWT access token upon successful login
    """
    # Find user by username
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    
    return Token(access_token=access_token, token_type="bearer")

