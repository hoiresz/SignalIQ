from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel, HttpUrl

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.ideal_customer_profile import IdealCustomerProfile
from app.services.ai_service import ai_service

router = APIRouter()


# Request/Response Models
class WebsiteAnalysisRequest(BaseModel):
    website_url: HttpUrl
    website_content: Optional[str] = None


class WebsiteAnalysisResponse(BaseModel):
    company_description: str
    industry: str
    target_market: str
    key_products: List[str]
    value_proposition: str
    company_size_indicators: str
    technology_stack: List[str]
    recent_news: List[str]


@router.post("/website", response_model=WebsiteAnalysisResponse)
async def analyze_website(
    request: WebsiteAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze a company website to extract business information"""
    try:
        analysis = await ai_service.analyze_website(
            website_url=str(request.website_url),
            website_content=request.website_content
        )
        
        return WebsiteAnalysisResponse(
            company_description=analysis.company_description,
            industry=analysis.industry,
            target_market=analysis.target_market,
            key_products=analysis.key_products,
            value_proposition=analysis.value_proposition,
            company_size_indicators=analysis.company_size_indicators,
            technology_stack=analysis.technology_stack,
            recent_news=analysis.recent_news
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze website: {str(e)}"
        )