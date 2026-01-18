from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class TavernState(TypedDict):
    """
    State definition for the Tavern Game LangGraph.
    
    Tracks conversation state, customer context, and game status.
    """
    messages: Annotated[list[BaseMessage], add_messages]
    customer_id: str
    is_fed: bool
    current_story_data: dict
    weather_info: str
    thread_id: str
    customer_context: dict  # Stores customer personality and available stories

