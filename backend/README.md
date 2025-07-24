# SignalIQ Backend

Flask backend for SignalIQ B2B lead generation tool with OpenAI integration.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

4. Run the application:
```bash
python app.py
```

## API Endpoints

### POST /api/generate-leads
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

### GET /api/conversations/{id}/leads
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

## Database Schema

The backend uses a flexible schema that supports dynamic columns:

- `lead_tables`: Named collections of leads per conversation
- `lead_rows`: Individual lead entities (companies/people)
- `lead_columns`: Dynamic column definitions
- `lead_cells`: Actual data values for each row/column intersection

This allows for Google Sheets/Airtable-like functionality where users can add arbitrary columns through natural language.