# Tavern Game Backend

Backend API for the Tavern Game with AI-powered customer interactions.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your actual credentials:
   - PostgreSQL database URL
   - Google Gemini API key
   - OpenWeatherMap API key
   - JWT secret key

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

