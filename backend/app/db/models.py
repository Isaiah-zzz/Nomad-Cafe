from sqlalchemy import Column, String, Text, ForeignKey, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base


class User(Base):
    """User accounts for client players"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # One-to-one relationship with Customer
    customer = relationship("Customer", back_populates="user", uselist=False)
    # One-to-one relationship with Admin (if user is an admin)
    admin = relationship("Admin", back_populates="user", uselist=False)


class Customer(Base):
    """Profiles of NPCs (Name, personality traits, visual assets)"""
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    personality_traits = Column(Text)  # JSON string or text description
    visual_description = Column(Text)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="customer")
    stories = relationship("Story", back_populates="customer", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="customer", cascade="all, delete-orphan")


class Story(Base):
    """Travel story data from Admin page"""
    __tablename__ = "stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True)
    destination = Column(String(200), nullable=False)
    what_happened = Column(Text, nullable=False)
    interesting_things = Column(Text)
    pictures = Column(JSON)  # Array of URLs/paths
    artifact = Column(String(200))  # Optional artifact description
    emotion = Column(String(50))  # Optional emotion tag
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, published, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="stories")


class Interaction(Base):
    """LangGraph Checkpointer - Stores serialized conversation state"""
    __tablename__ = "interactions"

    thread_id = Column(String(255), primary_key=True)  # LangGraph thread ID
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True)
    checkpoint_data = Column(JSONB)  # Stores LangGraph state
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    message_count = Column(Integer, default=0)

    # Relationships
    customer = relationship("Customer", back_populates="interactions")


class Admin(Base):
    """Admin accounts - separate table for admin users"""
    __tablename__ = "admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="admin")

