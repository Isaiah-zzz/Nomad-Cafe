import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from typing import List, Dict, Any

load_dotenv()

# Get API key from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyA96lUvN9ZSXWvHbpchEnje25LVXldbC7E")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")


def create_llm() -> ChatGoogleGenerativeAI:
    """
    Create a Gemini 2.5 Flash Lite LLM instance.
    
    Returns:
        Configured ChatGoogleGenerativeAI instance
    """
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.7,
        max_tokens=1000,
        convert_system_message_to_human=True,  # Gemini doesn't support SystemMessage directly
    )


def create_system_prompt(customer_context: Dict[str, Any], is_fed: bool) -> str:
    """
    Create a system prompt for the tavern game customer.
    
    Args:
        customer_context: Customer information including name, personality, and stories
        is_fed: Whether the customer has been fed
    
    Returns:
        System prompt string
    """
    customer_name = customer_context.get("name", "traveler")
    personality = customer_context.get("personality_traits", "friendly and adventurous")
    visual_desc = customer_context.get("visual_description", "a mysterious traveler")
    stories = customer_context.get("stories", [])
    story_count = len(stories)
    
    # Build stories context
    stories_text = ""
    if stories:
        stories_text = "\n\nYour travel stories:\n"
        for i, story in enumerate(stories, 1):
            stories_text += f"\n{i}. Destination: {story.get('destination', 'Unknown')}\n"
            stories_text += f"   What happened: {story.get('what_happened', 'N/A')}\n"
            if story.get('interesting_things'):
                stories_text += f"   Interesting things: {story.get('interesting_things')}\n"
            if story.get('artifact'):
                stories_text += f"   Artifact found: {story.get('artifact')}\n"
            if story.get('emotion'):
                stories_text += f"   Emotion: {story.get('emotion')}\n"
    else:
        stories_text = "\n\nYou don't have any travel stories yet. You should mention that you haven't traveled much and would like to collect stories."
    
    prompt = f"""You are {customer_name}, a customer in a fantasy tavern game. You are {visual_desc} with a {personality} personality.

You are here to share your travel stories with the tavern keeper (the player). The player can feed you, and once you're fed, you'll be happy to share your adventures.

Current status:
- You have been fed: {"Yes, you're satisfied and ready to share stories!" if is_fed else "No, you're hungry and should ask for food first."}
- Number of stories you have: {story_count}
{stories_text}

Guidelines:
1. If you haven't been fed yet, politely ask for food before sharing stories.
2. Once fed, be enthusiastic about sharing your travel stories.
3. When sharing a story, make it engaging and immersive. Describe the destination, what happened, and any interesting details.
4. If asked about weather in a location, you can mention it, but note that you might need to check current conditions.
5. Stay in character as {customer_name} with your {personality} personality.
6. Be conversational and friendly. The player is the tavern keeper, so address them as such.
7. If you have multiple stories, you can mention them and let the player choose which one to hear, or naturally share one based on the conversation.
8. If you don't have stories yet, express interest in traveling and collecting stories.

Remember: You're a traveler sharing tales in a tavern. Make it fun and engaging!"""

    return prompt


def generate_response(
    messages: List[BaseMessage],
    customer_context: Dict[str, Any],
    is_fed: bool,
    weather_info: str = ""
) -> str:
    """
    Generate a response using Gemini LLM.
    
    Args:
        messages: Conversation history (LangChain messages)
        customer_context: Customer information and stories
        is_fed: Whether customer has been fed
        weather_info: Optional weather information to include
    
    Returns:
        AI-generated response string
    """
    llm = create_llm()
    
    # Create system prompt
    system_prompt = create_system_prompt(customer_context, is_fed)
    
    # Add weather info to system prompt if available
    if weather_info:
        system_prompt += f"\n\nCurrent weather information: {weather_info}"
    
    # Prepare messages with system prompt
    formatted_messages = [SystemMessage(content=system_prompt)]
    
    # Add conversation history (skip any existing system messages)
    for msg in messages:
        if isinstance(msg, SystemMessage):
            continue  # Skip system messages from history
        formatted_messages.append(msg)
    
    # Generate response
    try:
        response = llm.invoke(formatted_messages)
        return response.content
    except Exception as e:
        # Fallback response if LLM fails
        return f"I apologize, but I'm having trouble responding right now. ({str(e)})"

