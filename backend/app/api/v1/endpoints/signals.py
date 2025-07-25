from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.ideal_customer_profile import IdealCustomerProfile
from app.services.ai_service import ai_service

router = APIRouter()


# Request/Response Models
class SignalGenerationRequest(BaseModel):
    icp_id: str
    company_info: Optional[str] = None


class LeadSignal(BaseModel):
    name: str
    description: str
    criteria: Dict[str, Any]
    priority: str
    estimated_volume: str


class SignalGenerationResponse(BaseModel):
    signals: List[LeadSignal]
    reasoning: str
    additional_recommendations: List[str]


@router.post("/generate", response_model=SignalGenerationResponse)
async def generate_signals(
    request: SignalGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate lead tracking signals based on ICP profile"""
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
        
        # Generate signals using AI service
        signals_response = await ai_service.generate_signals(
            company_info=request.company_info or icp.company_info or "",
            solution_products=icp.solution_products,
            target_customers=icp.target_customers,
            icp_profile=icp_profile
        )
        
        return SignalGenerationResponse(
            signals=[
                LeadSignal(
                    name=signal.name,
                    description=signal.description,
                    criteria=signal.criteria,
                    priority=signal.priority,
                    estimated_volume=signal.estimated_volume
                )
                for signal in signals_response.signals
            ],
            reasoning=signals_response.reasoning,
            additional_recommendations=signals_response.additional_recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate signals: {str(e)}"
        )