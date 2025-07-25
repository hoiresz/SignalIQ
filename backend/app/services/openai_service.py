"""
OpenAI Service with modular templates for different AI operations
"""
import json
import logging
from typing import Dict, List, Any, Optional, Type, TypeVar, Generic
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


class OpenAITemplate(ABC, Generic[T]):
    """Abstract base class for OpenAI operation templates"""
    
    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt for the AI"""
        pass
    
    @property
    @abstractmethod
    def response_model(self) -> Type[T]:
        """Pydantic model for response validation"""
        pass
    
    @property
    def model(self) -> str:
        """OpenAI model to use"""
        return "gpt-4"
    
    @property
    def temperature(self) -> float:
        """Temperature for AI responses"""
        return 0.7
    
    @property
    def max_tokens(self) -> int:
        """Maximum tokens for response"""
        return 2000
    
    @abstractmethod
    def build_user_prompt(self, **kwargs) -> str:
        """Build user prompt from input parameters"""
        pass
    
    def validate_response(self, response: Dict[str, Any]) -> T:
        """Validate and parse AI response"""
        return self.response_model(**response)


# Response Models
class WebsiteAnalysis(BaseModel):
    """Website analysis response model"""
    company_description: str = Field(description="Brief description of what the company does")
    industry: str = Field(description="Primary industry/sector")
    target_market: str = Field(description="Who they serve/target market")
    key_products: List[str] = Field(description="Main products or services")
    value_proposition: str = Field(description="Core value proposition")
    company_size_indicators: str = Field(description="Indicators of company size from website")
    technology_stack: List[str] = Field(description="Technologies mentioned or evident")
    recent_news: List[str] = Field(description="Recent news, updates, or announcements")


class LeadSignal(BaseModel):
    """Individual lead signal model"""
    name: str = Field(description="Clear, descriptive name for the signal")
    description: str = Field(description="Detailed description of what this signal identifies")
    criteria: Dict[str, Any] = Field(description="Specific criteria for the signal")
    priority: str = Field(description="High, Medium, or Low priority")
    estimated_volume: str = Field(description="Expected number of leads this might generate")


class SignalGenerationResponse(BaseModel):
    """Response model for signal generation"""
    signals: List[LeadSignal] = Field(description="List of generated lead signals")
    reasoning: str = Field(description="Explanation of why these signals were chosen")
    additional_recommendations: List[str] = Field(description="Additional suggestions")


class LeadGenerationResponse(BaseModel):
    """Response model for lead generation"""
    message: str = Field(description="Human-readable message about the results")
    leads: List[Dict[str, Any]] = Field(description="Generated leads data")
    suggested_columns: List[str] = Field(description="Suggested table columns")


# Template Implementations
class WebsiteAnalysisTemplate(OpenAITemplate[WebsiteAnalysis]):
    """Template for analyzing company websites"""
    
    @property
    def system_prompt(self) -> str:
        return """You are a business intelligence analyst specializing in company research. 
        Your job is to analyze company websites and extract key business information.
        
        Analyze the provided website content and extract:
        1. What the company does (core business)
        2. Their industry/sector
        3. Target market and customers
        4. Key products/services
        5. Value proposition
        6. Company size indicators
        7. Technology stack (if evident)
        8. Recent news or updates
        
        Be concise but comprehensive. Focus on information that would be valuable for B2B lead generation.
        
        Return your analysis in the specified JSON format."""
    
    @property
    def response_model(self) -> Type[WebsiteAnalysis]:
        return WebsiteAnalysis
    
    def build_user_prompt(self, website_url: str, website_content: str = None, **kwargs) -> str:
        if website_content:
            return f"""
            Please analyze this website content for: {website_url}
            
            Website Content:
            {website_content[:5000]}  # Limit content length
            
            Provide a comprehensive analysis of this company.
            """
        else:
            return f"""
            Please analyze the website: {website_url}
            
            Note: I cannot access the website directly, so please provide analysis based on the URL 
            and any general knowledge you have about this company. If you don't have specific 
            information, indicate that website scraping would be needed for detailed analysis.
            """


class SignalGenerationTemplate(OpenAITemplate[SignalGenerationResponse]):
    """Template for generating lead tracking signals"""
    
    @property
    def system_prompt(self) -> str:
        return """You are a lead generation expert specializing in creating targeted signals 
        for B2B prospecting. Your job is to generate specific, actionable lead tracking signals 
        based on a company's profile and ideal customer profile.
        
        Lead signals should be:
        1. Specific and measurable
        2. Actionable (can be tracked/monitored)
        3. Relevant to the company's target market
        4. Diverse in approach (hiring, funding, technology adoption, etc.)
        5. Realistic to implement
        
        Consider various signal types:
        - Hiring signals (job postings, team expansion)
        - Funding signals (investment rounds, financial news)
        - Technology signals (new tool adoption, tech stack changes)
        - Growth signals (office expansion, new markets)
        - Intent signals (content consumption, event participation)
        - Competitive signals (competitor mentions, switching)
        - Regulatory signals (compliance needs, industry changes)
        
        Return 5-8 high-quality signals with clear criteria and implementation guidance."""
    
    @property
    def response_model(self) -> Type[SignalGenerationResponse]:
        return SignalGenerationResponse
    
    def build_user_prompt(self, 
                         company_info: str,
                         solution_products: str,
                         target_customers: str,
                         icp_profile: Optional[Dict] = None,
                         **kwargs) -> str:
        
        icp_context = ""
        if icp_profile:
            icp_context = f"""
            Additional ICP Details:
            - Company Sizes: {icp_profile.get('company_sizes', [])}
            - Funding Stages: {icp_profile.get('funding_stages', [])}
            - Locations: {icp_profile.get('locations', [])}
            - Job Titles: {icp_profile.get('titles', '')}
            """
        
        return f"""
        Generate comprehensive lead tracking signals for this company:
        
        Company Information: {company_info}
        
        Solution & Products: {solution_products}
        
        Target Customers: {target_customers}
        
        {icp_context}
        
        Please generate specific, actionable lead signals that would help identify potential 
        customers for this company. Focus on signals that indicate buying intent, growth, 
        or need for their solution.
        
        Each signal should include:
        - Clear name and description
        - Specific criteria for identification
        - Priority level and estimated volume
        - Implementation approach
        """


class LeadGenerationTemplate(OpenAITemplate[LeadGenerationResponse]):
    """Template for generating leads based on queries"""
    
    @property
    def system_prompt(self) -> str:
        return """You are SignalIQ, an AI assistant that helps users find B2B leads 
        (companies and people) based on their criteria.

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

        Return your response in the specified JSON format."""
    
    @property
    def response_model(self) -> Type[LeadGenerationResponse]:
        return LeadGenerationResponse
    
    def build_user_prompt(self, 
                         query: str,
                         existing_columns: List[str] = None,
                         context: Dict = None,
                         **kwargs) -> str:
        
        context_str = ""
        if existing_columns:
            context_str += f"Existing columns: {existing_columns}\n"
        if context:
            context_str += f"Previous context: {context}\n"
        
        return f"""
        Query: {query}
        
        {context_str}
        
        Please generate relevant leads based on this query. If this is a follow-up request 
        (like "add CEO info" or "find 20 more"), build upon the existing structure.
        """


class OpenAIService:
    """Main service for handling OpenAI operations with templates"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        # Register available templates
        self.templates = {
            'website_analysis': WebsiteAnalysisTemplate(),
            'signal_generation': SignalGenerationTemplate(),
            'lead_generation': LeadGenerationTemplate(),
        }
    
    async def execute_template(self, 
                              template_name: str, 
                              **kwargs) -> Any:
        """Execute a specific template with given parameters"""
        
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found. Available: {list(self.templates.keys())}")
        
        template = self.templates[template_name]
        
        try:
            # Build prompts
            system_prompt = template.system_prompt
            user_prompt = template.build_user_prompt(**kwargs)
            
            # Make OpenAI call
            response = await self.client.chat.completions.create(
                model=template.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=template.temperature,
                max_tokens=template.max_tokens
            )
            
            # Parse and validate response
            result_text = response.choices[0].message.content
            result_json = json.loads(result_text)
            
            # Validate with Pydantic model
            validated_result = template.validate_response(result_json)
            
            return validated_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response as JSON: {e}")
            logger.error(f"Raw response: {result_text}")
            raise ValueError("Invalid JSON response from OpenAI")
        
        except Exception as e:
            logger.error(f"Error executing template '{template_name}': {str(e)}")
            raise
    
    async def analyze_website(self, website_url: str, website_content: str = None) -> WebsiteAnalysis:
        """Analyze a company website"""
        return await self.execute_template(
            'website_analysis',
            website_url=website_url,
            website_content=website_content
        )
    
    async def generate_signals(self, 
                              company_info: str,
                              solution_products: str,
                              target_customers: str,
                              icp_profile: Optional[Dict] = None) -> SignalGenerationResponse:
        """Generate lead tracking signals"""
        return await self.execute_template(
            'signal_generation',
            company_info=company_info,
            solution_products=solution_products,
            target_customers=target_customers,
            icp_profile=icp_profile
        )
    
    async def generate_leads(self, 
                            query: str,
                            existing_columns: List[str] = None,
                            context: Dict = None) -> LeadGenerationResponse:
        """Generate leads based on query"""
        return await self.execute_template(
            'lead_generation',
            query=query,
            existing_columns=existing_columns,
            context=context
        )
    
    def register_template(self, name: str, template: OpenAITemplate):
        """Register a new template"""
        self.templates[name] = template
    
    def list_templates(self) -> List[str]:
        """List available templates"""
        return list(self.templates.keys())


# Global service instance
openai_service = OpenAIService()