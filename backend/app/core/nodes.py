from typing import Dict, Any
from langchain_core.messages import HumanMessage, AIMessage

from app.core.state import TavernState
from app.db.models import Customer, Story
from app.db.database import SessionLocal
from app.services.llm import generate_response


def fetch_context_node(state: TavernState) -> Dict[str, Any]:
    """
    Fetch customer context from database.
    Loads customer personality and available stories.
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state with customer_context populated
    """
    customer_id = state.get("customer_id")
    if not customer_id:
        return {
            "customer_context": {
                "error": "No customer_id provided"
            }
        }
    
    # Create database session
    db = SessionLocal()
    try:
        # Fetch customer from database
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return {
                "customer_context": {
                    "error": f"Customer with id {customer_id} not found"
                }
            }
        
        # Fetch only published stories for this customer (for game interactions)
        stories = db.query(Story).filter(
            Story.customer_id == customer_id,
            Story.status == "published"
        ).all()
    finally:
        db.close()
    
    # Format stories for context
    story_list = []
    for story in stories:
        story_dict = {
            "id": str(story.id),
            "destination": story.destination,
            "what_happened": story.what_happened,
            "interesting_things": story.interesting_things,
            "artifact": story.artifact,
            "emotion": story.emotion,
            "pictures": story.pictures
        }
        story_list.append(story_dict)
    
    # Build customer context
    customer_context = {
        "customer_id": str(customer.id),
        "name": customer.name,
        "personality_traits": customer.personality_traits or "friendly and adventurous",
        "visual_description": customer.visual_description or "a mysterious traveler",
        "stories": story_list,
        "story_count": len(story_list)
    }
    
    return {
        "customer_context": customer_context
    }


def chat_node(state: TavernState) -> Dict[str, Any]:
    """
    Chat node that processes messages using Gemini LLM.
    
    Uses the customer context and conversation history to generate
    appropriate responses based on the customer's personality and stories.
    
    Args:
        state: Current graph state
    
    Returns:
        Updated state with AI response message and potentially story data
    """
    messages = state.get("messages", [])
    is_fed = state.get("is_fed", False)
    customer_context = state.get("customer_context", {})
    weather_info = state.get("weather_info", "")
    
    # Check for errors in customer context
    if customer_context.get("error"):
        error_msg = customer_context.get("error", "Unknown error")
        response = f"I apologize, but there seems to be an issue: {error_msg}"
        ai_message = AIMessage(content=response)
        new_messages = messages + [ai_message]
        return {
            "messages": new_messages
        }
    
    # Generate response using Gemini LLM
    try:
        response = generate_response(
            messages=messages,
            customer_context=customer_context,
            is_fed=is_fed,
            weather_info=weather_info
        )
    except Exception as e:
        # Fallback response if LLM fails
        customer_name = customer_context.get("name", "traveler")
        if not is_fed:
            response = f"I'm quite hungry! Could you bring me some food first? Then I'll be happy to share my travel stories with you."
        else:
            response = f"Thank you for the meal! I'm {customer_name}, and I'd love to share my travel stories with you."
    
    # Try to detect if a story is being shared by checking the response
    # against available stories (simple keyword matching for now)
    current_story_data = {}
    stories = customer_context.get("stories", [])
    
    if stories and is_fed:
        # Check if response mentions any destination from stories
        response_lower = response.lower()
        for story in stories:
            destination = story.get("destination", "").lower()
            if destination and destination in response_lower:
                # This story is likely being shared
                current_story_data = {
                    "story_id": story.get("id"),
                    "destination": story.get("destination"),
                    "artifact": story.get("artifact"),
                    "emotion": story.get("emotion")
                }
                break
    
    # Add AI response to messages
    ai_message = AIMessage(content=response)
    new_messages = messages + [ai_message]
    
    return {
        "messages": new_messages,
        "current_story_data": current_story_data if current_story_data else state.get("current_story_data", {})
    }

