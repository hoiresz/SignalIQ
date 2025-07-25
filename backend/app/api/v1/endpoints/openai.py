"""
OpenAI API endpoints for various AI operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from uuid import UUID

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.ideal_customer_profile import IdealCustomerProfile
from app.services.openai_service import openai_service, WebsiteAnalysis, SignalGenerationResponse
from pydantic import BaseModel

router = APIRouter()


# Request/Response Models
class WebsiteAnalysisRequest(BaseModel):
    website_url: str
    website_content: Optional[str] = None


class SignalGenerationRequest(BaseModel):
    icp_id: str
    company_info: Optional[str] = None


class WebsiteAnalysisResponse(BaseModel):
    analysis: WebsiteAnalysis


# Endpoints
@router.post("/analyze-website", response_model=WebsiteAnalysisResponse)
async def analyze_website(
    request: WebsiteAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze a company website using AI"""
    try:
        analysis = await openai_service.analyze_website(
            website_url=request.website_url,
            website_content=request.website_content
        )
        
        return WebsiteAnalysisResponse(analysis=analysis)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze website: {str(e)}"
        )


@router.post("/generate-signals", response_model=SignalGenerationResponse)
async def generate_signals(
    request: SignalGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate lead tracking signals based on ICP"""
    try:
        # Get ICP profile
        result = await db.execute(
            select(IdealCustomerProfile)
            .where(
                IdealCustomerProfile.id == UUID(request.icp_id),
                IdealCustomerProfile.user_id == current_user.id
            )
        )
        
        icp = result.scalar_one_or_none()
        if not icp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ICP profile not found"
            )
        
        # Prepare ICP data
        icp_profile = {
            'company_sizes': icp.company_sizes,
            'funding_stages': icp.funding_stages,
            'locations': icp.locations,
            'titles': icp.titles
        }
        
        # Generate signals
        signals = await openai_service.generate_signals(
            company_info=request.company_info or icp.company_info or "",
            solution_products=icp.solution_products,
            target_customers=icp.target_customers,
            icp_profile=icp_profile
        )
        
        return signals
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signals: {str(e)}"
        )


@router.get("/templates")
async def list_templates(
    current_user: User = Depends(get_current_user)
):
    """List available OpenAI templates"""
    return {
        "templates": openai_service.list_templates(),
        "descriptions": {
            "website_analysis": "Analyze company websites to extract business information",
            "signal_generation": "Generate lead tracking signals based on ICP",
            "lead_generation": "Generate leads based on natural language queries"
        }
    }