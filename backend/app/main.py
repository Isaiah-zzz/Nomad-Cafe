from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Import models to register them with SQLAlchemy
from app.db import models  # noqa: F401
from app.api import admin, auth, game, client, client_auth

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Tavern Game API",
    description="Backend API for the Tavern Game with AI-powered customer interactions",
    version="1.0.0"
)

# CORS middleware (configure as needed for your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(client_auth.router)  # Client authentication
app.include_router(auth.router)  # Admin authentication
app.include_router(client.router)  # Client API
app.include_router(admin.router)  # Admin API
app.include_router(game.router)  # Game API


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Tavern Game API is running",
        "status": "healthy"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"  # TODO: Add actual DB health check
    }

