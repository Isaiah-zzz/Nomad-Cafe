from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage
from uuid import UUID

from app.db.database import get_db
from app.schemas.game import ChatRequest, ChatResponse, StatusRequest, StatusResponse
from app.core.graph import create_tavern_graph, create_thread_id
from app.core.state import TavernState

router = APIRouter(prefix="/game", tags=["game"])

# Create graph instance (will be enhanced in later steps)
_graph = None


def get_graph():
    """Get or create the LangGraph instance"""
    global _graph
    if _graph is None:
        _graph = create_tavern_graph()
    return _graph


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Main chat endpoint for player-customer dialogue.
    
    Processes the player's message and returns the AI customer's response.
    """
    graph = get_graph()
    
    # Convert UUID to string for state
    customer_id_str = str(request.character_id)
    
    # Create initial state
    config = {"configurable": {"thread_id": request.thread_id}}
    
    # Get current state (if thread exists)
    try:
        current_state = graph.get_state(config)
        current_state_value = current_state.values if current_state.values else {}
    except Exception:
        current_state_value = {}
    
    # Prepare state update
    state_update: TavernState = {
        "customer_id": customer_id_str,
        "is_fed": request.is_fed,
        "current_story_data": current_state_value.get("current_story_data", {}),
        "weather_info": current_state_value.get("weather_info", ""),
        "thread_id": request.thread_id,
        "customer_context": current_state_value.get("customer_context", {}),
        "messages": current_state_value.get("messages", []) + [HumanMessage(content=request.message)]
    }
    
    # Invoke the graph
    try:
        result = graph.invoke(state_update, config)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )
    
    # Extract AI response from messages
    ai_response = ""
    artifact = None
    story_id = None
    
    for msg in reversed(result.get("messages", [])):
        if hasattr(msg, "content") and msg.__class__.__name__ == "AIMessage":
            ai_response = msg.content
            break
    
    # Extract artifact and story info from current_story_data if available
    story_data = result.get("current_story_data", {})
    if story_data:
        artifact = story_data.get("artifact")
        story_id = story_data.get("story_id")
    
    return ChatResponse(
        response=ai_response,
        artifact=artifact,
        story_id=story_id,
        thread_id=request.thread_id,
        is_fed=request.is_fed
    )


@router.get("/status/{thread_id}", response_model=StatusResponse)
async def get_status(
    thread_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the status of a conversation thread.
    """
    graph = get_graph()
    config = {"configurable": {"thread_id": thread_id}}
    
    try:
        state = graph.get_state(config)
        state_values = state.values if state.values else {}
        
        return StatusResponse(
            thread_id=thread_id,
            customer_id=state_values.get("customer_id", ""),
            is_fed=state_values.get("is_fed", False),
            message_count=len(state_values.get("messages", [])),
            last_updated=state.metadata.get("last_updated") if state.metadata else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found: {str(e)}"
        )

