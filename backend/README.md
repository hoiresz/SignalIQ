# SignalIQ FastAPI Backend

Modern async FastAPI backend for SignalIQ B2B lead generation tool with OpenAI integration.

## Features

- **FastAPI**: Modern, fast web framework with automatic API documentation
- **Async/Await**: Full async support for better performance
- **OpenAI Integration**: GPT-4 powered lead generation
- **Supabase**: Real-time database with flexible schema
- **Pydantic**: Data validation and serialization
- **Structured Architecture**: Clean separation of concerns

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app instance and configuration
│   ├── api/                 # API routes
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/
│   │           ├── leads.py
│   │           └── health.py
│   ├── core/                # Core configuration and security
│   │   ├── config.py
│   │   └── security.py
│   ├── schemas/             # Pydantic models
│   │   └── leads.py
│   ├── services/            # Business logic
│   │   ├── lead_generator.py
│   │   └── supabase_service.py
│   └── deps.py              # FastAPI dependencies
├── requirements.txt
├── Dockerfile
└── README.md
```

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Copy environment variables:**
```bash
cp .env.example .env
```

3. **Configure your environment variables in `.env`:**
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

4. **Run the application:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

## API Documentation

Once running, visit:
- **Interactive API docs**: http://localhost:5000/docs
- **ReDoc documentation**: http://localhost:5000/redoc

## API Endpoints

### POST /api/v1/leads/generate
Generate leads based on natural language query.

**Request:**
```json
{
  "query": "Find companies that raised less than $5M in Web3",
  "conversation_id": "uuid",
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Found 5 companies matching your criteria...",
  "leads": [...],
  "lead_table_id": "uuid"
}
```

### GET /api/v1/leads/conversations/{id}
Get all leads for a conversation.

**Headers:**
- `X-User-ID`: User UUID

**Response:**
```json
{
  "leads": [...],
  "columns": ["Name", "Industry", "Funding", ...]
}
```

## Development

### Running with Docker

```bash
docker build -t signaliq-backend .
docker run -p 5000:5000 --env-file .env signaliq-backend
```

### Code Structure

- **`app/main.py`**: FastAPI application setup, middleware, and startup events
- **`app/api/v1/endpoints/`**: API route handlers
- **`app/services/`**: Business logic and external service integrations
- **`app/schemas/`**: Pydantic models for request/response validation
- **`app/core/`**: Configuration and security utilities
- **`app/deps.py`**: FastAPI dependency injection helpers

## Key Features

### Async OpenAI Integration
- Uses `AsyncOpenAI` client for non-blocking API calls
- Structured prompts for consistent lead generation
- Error handling and fallback responses

### Flexible Database Schema
- Dynamic column creation based on AI responses
- Supports both companies and people as lead types
- Efficient querying with proper indexing

### Modern FastAPI Features
- Automatic API documentation generation
- Request/response validation with Pydantic
- Dependency injection for clean architecture
- CORS middleware for frontend integration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 access | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `DEBUG` | Enable debug mode | No (default: True) |
| `HOST` | Server host | No (default: 0.0.0.0) |
| `PORT` | Server port | No (default: 5000) |