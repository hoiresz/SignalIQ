import json
import logging
from typing import Dict, List, Any

from app.services.openai_service import openai_service

logger = logging.getLogger(__name__)


class LeadGeneratorService:
    async def generate_leads(
        self, 
        query: str, 
        existing_columns: List[str] = None, 
        context: Dict = None
    ) -> Dict[str, Any]:
        """Generate leads based on natural language query using OpenAI"""
        
        try:
            # Use the new OpenAI service
            result = await openai_service.generate_leads(
                query=query,
                existing_columns=existing_columns,
                context=context
            )
            
            # Convert Pydantic model to dict for backward compatibility
            return {
                "message": result.message,
                "leads": result.leads,
                "suggested_columns": result.suggested_columns
            }
            
        except Exception as e:
            logger.error(f"Error generating leads: {str(e)}")
            return {
                "message": "I encountered an error while processing your request. Please try again.",
                "leads": [],
                "suggested_columns": []
            }