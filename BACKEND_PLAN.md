# Tavern Game Backend Implementation Plan

To build a robust backend for your tavern game, we need to focus on three pillars: **Story Management (Admin)**, **The Agent Logic (LangGraph)**, and **Stateful Persistence (Memory)**.

Here is the step-by-step backend execution plan.

## 🏗️ Phase 1: Database Schema (The Foundation)

You need a relational database (PostgreSQL is recommended) to handle the structured story data and the AI's long-term memory.

### 1. Tables

- **users**: High-level account info (for admin page access)
  - `id` (UUID, primary key)
  - `username` (string, unique)
  - `email` (string, unique)
  - `password_hash` (string)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **customers**: Profiles of NPCs (Name, personality traits, visual assets)
  - `id` (UUID, primary key)
  - `name` (string)
  - `personality_traits` (JSON/text)
  - `visual_description` (text)
  - `user_id` (UUID, foreign key to users - one customer per user account)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **stories**: The data from your Admin page (Destination, event, artifact, emotion)
  - `id` (UUID, primary key)
  - `customer_id` (UUID, foreign key to customers)
  - `destination` (string)
  - `what_happened` (text)
  - `interesting_things` (text)
  - `pictures` (JSON array of URLs/paths, optional)
  - `artifact` (text, optional)
  - `emotion` (string, optional)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **interactions**: (The LangGraph Checkpointer) Stores the serialized state of conversations so characters remember the player
  - `thread_id` (string, primary key)
  - `customer_id` (UUID, foreign key to customers)
  - `checkpoint_data` (JSONB - stores LangGraph state)
  - `last_updated` (timestamp)
  - `message_count` (integer)

## 🤖 Phase 2: LangGraph Agent Design

This is the core "Brain" of your backend. You will build this using Python (FastAPI).

### 1. The State Definition

The AI needs to track specific variables throughout the chat:

```python
class TavernState(TypedDict):
    messages: Annotated[list, add_messages]
    customer_id: str
    is_fed: bool
    current_story_data: dict
    weather_info: str
    thread_id: str
```

### 2. The Nodes (Functions)

- **fetch_context_node**: When the character_id is passed, this function queries the DB for that character's stories and personality.
- **chat_node**: The LLM (Gemini 1.5 Flash) processes the message and decides whether to share a story, ask for food, or use tools.
- **weather_tool**: A function that triggers only if the LLM decides it needs real-time weather data (via OpenWeatherMap API or similar).
- **story_selection_node**: Chooses which story to share based on conversation context and what stories haven't been told yet.

### 3. The Graph Flow

```
START → fetch_context_node → chat_node → [weather_tool if needed] → END
         ↑                                    ↓
         └─────────── (loop back if continuing conversation)
```

## 🔌 Phase 3: The API Endpoint Structure

Instead of multiple calls, your frontend will interact with one primary "Action" endpoint.

### POST /game/chat

**Payload:**
```json
{
  "thread_id": "unique-session-id",
  "character_id": "customer-uuid",
  "message": "Tell me about your travels!",
  "is_fed": true
}
```

**Backend Logic:**
1. Initialize Graph: Load the LangGraph workflow.
2. Load Checkpoint: Use the thread_id to pull the previous conversation state from Postgres.
3. Execute: Run the graph. The LLM will see the is_fed status and choose to either share a story or ask for food.
4. Respond: Return the AI's text and any "Artifact" metadata found in the story DB.

**Response:**
```json
{
  "response": "Ah, let me tell you about my journey to the mountains...",
  "artifact": "A mysterious crystal",
  "story_id": "story-uuid",
  "thread_id": "unique-session-id"
}
```

### GET /game/status/{thread_id}

Returns the current state of a conversation thread (useful for reconnection).

## 🛠️ Phase 4: Admin API

This handles the "Story Collection" side of your game.

### POST /admin/story

Saves a new travel entry (Destination, what happened, emotion).

**Payload:**
```json
{
  "customer_id": "customer-uuid",
  "destination": "The Northern Mountains",
  "what_happened": "Encountered a dragon...",
  "interesting_things": "Found ancient ruins",
  "pictures": ["url1", "url2"],
  "artifact": "Dragon scale",
  "emotion": "excited"
}
```

### GET /admin/stories/{customer_id}

Retrieves all stories for a character to display in the admin panel.

### GET /admin/customers

Lists all customers (NPCs) with their associated user accounts.

### POST /admin/customer

Creates a new customer profile.

**Payload:**
```json
{
  "user_id": "user-uuid",
  "name": "Bard the Wanderer",
  "personality_traits": "cheerful, adventurous",
  "visual_description": "A tall bard with a lute"
}
```

### Authentication

- POST /admin/auth/login: User login
- POST /admin/auth/register: User registration
- All admin endpoints require JWT authentication

## 📋 Implementation Roadmap

| Step | Task | Tools |
|------|------|-------|
| 1 | Set up FastAPI environment and PostgreSQL connection | Python, SQLAlchemy, Alembic |
| 2 | Build database models and migrations | SQLAlchemy ORM, Alembic |
| 3 | Build the Story CRUD (Create, Read, Update, Delete) for the Admin | FastAPI, Pydantic |
| 4 | Implement user authentication (JWT) | FastAPI, python-jose, passlib |
| 5 | Implement LangGraph with a basic "Buffer Memory" | LangGraph, LangChain |
| 6 | Add Tool Calling (Connect to OpenWeatherMap API) | HTTPX, LangGraph Tools |
| 7 | Add Persistent Checkpointer to save chats in Postgres | langgraph-checkpoint-postgres |
| 8 | Integrate Gemini 1.5 Flash LLM | Google Generative AI SDK |
| 9 | Build the main chat endpoint with state management | FastAPI, LangGraph |
| 10 | Add error handling and logging | Python logging, Sentry (optional) |

## 📦 Recommended Folder Structure

```
backend/
├── app/
│   ├── api/                # FastAPI routes
│   │   ├── __init__.py
│   │   ├── game.py         # /game/chat endpoint
│   │   └── admin.py        # /admin/* endpoints
│   ├── core/               # LangGraph definition
│   │   ├── __init__.py
│   │   ├── graph.py        # Graph construction
│   │   ├── nodes.py        # Node functions (fetch_context, chat, weather)
│   │   └── state.py        # TavernState definition
│   ├── db/                 # Models and Migrations
│   │   ├── __init__.py
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── database.py     # DB connection
│   │   └── migrations/     # Alembic migrations
│   ├── services/           # External APIs
│   │   ├── __init__.py
│   │   ├── weather.py      # Weather API client
│   │   └── llm.py          # Gemini LLM client
│   ├── schemas/            # Pydantic models
│   │   ├── __init__.py
│   │   ├── game.py         # Game request/response schemas
│   │   └── admin.py        # Admin request/response schemas
│   ├── auth/               # Authentication
│   │   ├── __init__.py
│   │   ├── jwt.py          # JWT utilities
│   │   └── dependencies.py # FastAPI dependencies
│   └── main.py             # Entry point
├── requirements.txt
├── .env                    # API Keys (Google, Weather, DB)
└── .env.example
```

## 🔑 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tavern_db

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key

# OpenWeatherMap API
WEATHER_API_KEY=your_weather_api_key

# JWT Secret
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256

# App Settings
DEBUG=True
LOG_LEVEL=INFO
```

## 🎯 Key Design Decisions

1. **Single API Endpoint**: The `/game/chat` endpoint handles all conversation logic, reducing frontend complexity.
2. **Thread-based Conversations**: Each conversation thread maintains its own state, allowing multiple concurrent conversations.
3. **Persistent Memory**: Using LangGraph's Postgres checkpointer ensures characters remember past interactions.
4. **One Customer Per User**: Each user account corresponds to exactly one customer NPC, simplifying the admin workflow.
5. **Optional Fields**: Stories can have optional pictures, artifacts, and emotions to allow flexibility in data collection.

---

**Next Steps**: Would you like me to start implementing Phase 1 (Database Schema) and Phase 2 (Basic LangGraph setup)?

