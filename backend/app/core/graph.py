from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.core.state import TavernState
from app.core.nodes import fetch_context_node, chat_node


def create_tavern_graph() -> StateGraph:
    """
    Create the LangGraph workflow for the tavern game.
    
    Graph flow:
    START → fetch_context_node → chat_node → END
    
    Returns:
        Compiled LangGraph StateGraph
    """
    # Create the graph
    workflow = StateGraph(TavernState)
    
    # Add nodes
    workflow.add_node("fetch_context", fetch_context_node)
    workflow.add_node("chat", chat_node)
    
    # Set entry point
    workflow.set_entry_point("fetch_context")
    
    # Define edges
    workflow.add_edge("fetch_context", "chat")
    workflow.add_edge("chat", END)
    
    # Compile with memory (basic buffer memory for now)
    # Persistent checkpointer will be added in step 7
    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)
    
    return graph


def create_thread_id(customer_id: str, user_id: str = None) -> str:
    """
    Generate a unique thread ID for a conversation.
    
    Args:
        customer_id: Customer UUID
        user_id: Optional user ID for multi-user support
    
    Returns:
        Unique thread ID string
    """
    if user_id:
        return f"{user_id}_{customer_id}"
    return f"thread_{customer_id}"

