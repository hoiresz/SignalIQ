"""
AI Service - LLM Agnostic Interface
This service provides a clean interface for AI operations that can be easily swapped
between different LLM providers (OpenAI, LangGraph, etc.) without changing the API routes.
"""
import logging
from typing import Dict, List, Any, Optional
from abc import ABC, abstractmethod

from app.services.openai_service import openai_service, WebsiteAnalysis, SignalGenerationResponse

logger = logging.getLogger(__name__)


class AIServiceInterface(ABC):
    """Abstract interface for AI services"""
    
    @abstractmethod
    async def analyze_website(self, website_url: str, website_content: str = None) -> WebsiteAnalysis:
        """Analyze a company website"""
        pass
    
    @abstractmethod
    async def generate_signals(self, 
                              company_info: str,
                              solution_products: str,
                              target_customers: str,
                              icp_profile: Optional[Dict] = None) -> SignalGenerationResponse:
        """Generate lead tracking signals"""
        pass
    
    @abstractmethod
    async def generate_leads(self, 
                            query: str,
                            existing_columns: List[str] = None,
                            context: Dict = None) -> Dict[str, Any]:
        """Generate leads based on query"""
        pass


class OpenAIService(AIServiceInterface):
    """OpenAI implementation of AI service"""
    
    def __init__(self):
        self.openai_service = openai_service
    
    async def analyze_website(self, website_url: str, website_content: str = None) -> WebsiteAnalysis:
        """Analyze a company website using OpenAI"""
        return await self.openai_service.analyze_website(website_url, website_content)
    
    async def generate_signals(self, 
                              company_info: str,
                              solution_products: str,
                              target_customers: str,
                              icp_profile: Optional[Dict] = None) -> SignalGenerationResponse:
        """Generate lead tracking signals using OpenAI"""
        return await self.openai_service.generate_signals(
            company_info=company_info,
            solution_products=solution_products,
            target_customers=target_customers,
            icp_profile=icp_profile
        )
    
    async def generate_leads(self, 
                            query: str,
                            existing_columns: List[str] = None,
                            context: Dict = None) -> Dict[str, Any]:
        """Generate leads based on query using OpenAI"""
        result = await self.openai_service.generate_leads(
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


# Global AI service instance - can be easily swapped for different implementations
ai_service: AIServiceInterface = OpenAIService()


# Future LangGraph implementation would look like:
# class LangGraphService(AIServiceInterface):
#     async def analyze_website(self, website_url: str, website_content: str = None) -> WebsiteAnalysis:
#         # LangGraph implementation
#         pass
#     
#     async def generate_signals(self, ...):
#         # LangGraph implementation
#         pass
#
# To switch to LangGraph, just change:
# ai_service = LangGraphService()