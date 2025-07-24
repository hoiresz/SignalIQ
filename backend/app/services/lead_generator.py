import json
import logging
from typing import Dict, List, Any
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class LeadGeneratorService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def generate_leads(
        self, 
        query: str, 
        existing_columns: List[str] = None, 
        context: Dict = None
    ) -> Dict[str, Any]:
        """Generate leads based on natural language query using OpenAI"""
        
        system_prompt = """You are SignalIQ, an AI assistant that helps users find B2B leads (companies and people) based on their criteria.

Your job is to:
1. Understand the user's query and extract search criteria
2. Generate realistic lead data that matches their requirements
3. Return structured data with appropriate columns
4. Support follow-up requests to add columns or find more leads

When generating leads:
- Create realistic company names, funding amounts, locations, etc.
- Include relevant fields like industry, funding stage, employee count, website
- For people, include title, company, LinkedIn, email, experience
- Make data diverse and realistic
- Support dynamic column addition based on user requests

Return your response in this JSON format:
{
  "message": "Found X companies/people matching your criteria...",
  "leads": [
    {
      "entity_type": "company" or "person",
      "data": {
        "Name": "Company/Person Name",
        "Industry": "...",
        "Funding": "...",
        // ... other relevant fields
      }
    }
  ],
  "suggested_columns": ["Name", "Industry", "Funding", "Location", "Website"]
}
"""

        user_prompt = f"""
Query: {query}

Context:
- Existing columns: {existing_columns or []}
- Previous context: {context or {}}

Please generate relevant leads based on this query. If this is a follow-up request (like "add CEO info" or "find 20 more"), build upon the existing structure.
"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Error generating leads: {str(e)}")
            return {
                "message": "I encountered an error while processing your request. Please try again.",
                "leads": [],
                "suggested_columns": []
            }