from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.ideal_customer_profile import IdealCustomerProfile
from app.models.lead_signal import LeadSignal
from app.schemas.user_profile import (
    UserProfileResponse, UserProfileUpdate,
    ICPCreate, ICPUpdate, ICPResponse,
    LeadSignalCreate, LeadSignalUpdate, LeadSignalResponse
)

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == current_user.id)
    )
    
    profile = result.scalar_one_or_none()
    if not profile:
        # Create default profile
        profile = UserProfile(
            user_id=current_user.id,
            company_website=None,
            onboarding_completed=False
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        company_website=profile.company_website,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_update: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    result = await db.execute(
        select(UserProfile)
        .where(UserProfile.user_id == current_user.id)
    )
    
    profile = result.scalar_one_or_none()
    if not profile:
        # Create new profile
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update fields
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        company_website=profile.company_website,
        onboarding_completed=profile.onboarding_completed,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.get("/icp-profiles", response_model=List[ICPResponse])
async def get_icp_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ICP profiles for current user"""
    result = await db.execute(
        select(IdealCustomerProfile)
        .where(IdealCustomerProfile.user_id == current_user.id)
        .order_by(IdealCustomerProfile.created_at.asc())
    )
    
    profiles = result.scalars().all()
    
    return [
        ICPResponse(
            id=str(profile.id),
            user_id=str(profile.user_id),
            name=profile.name,
            solution_products=profile.solution_products,
            target_region=profile.target_region,
            target_customers=profile.target_customers,
            company_sizes=profile.company_sizes,
            funding_stages=profile.funding_stages,
            locations=profile.locations,
            titles=profile.titles,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
        for profile in profiles
    ]


@router.post("/icp-profiles", response_model=ICPResponse)
async def create_icp_profile(
    icp_data: ICPCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new ICP profile"""
    icp = IdealCustomerProfile(
        user_id=current_user.id,
        **icp_data.dict()
    )
    
    db.add(icp)
    await db.commit()
    await db.refresh(icp)
    
    return ICPResponse(
        id=str(icp.id),
        user_id=str(icp.user_id),
        name=icp.name,
        solution_products=icp.solution_products,
        target_region=icp.target_region,
        target_customers=icp.target_customers,
        company_sizes=icp.company_sizes,
        funding_stages=icp.funding_stages,
        locations=icp.locations,
        titles=icp.titles,
        created_at=icp.created_at,
        updated_at=icp.updated_at
    )


@router.put("/icp-profiles/{icp_id}", response_model=ICPResponse)
async def update_icp_profile(
    icp_id: UUID,
    icp_update: ICPUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an ICP profile"""
    result = await db.execute(
        select(IdealCustomerProfile)
        .where(
            IdealCustomerProfile.id == icp_id,
            IdealCustomerProfile.user_id == current_user.id
        )
    )
    
    icp = result.scalar_one_or_none()
    if not icp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ICP profile not found"
        )
    
    # Update fields
    update_data = icp_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(icp, field, value)
    
    await db.commit()
    await db.refresh(icp)
    
    return ICPResponse(
        id=str(icp.id),
        user_id=str(icp.user_id),
        name=icp.name,
        solution_products=icp.solution_products,
        target_region=icp.target_region,
        target_customers=icp.target_customers,
        company_sizes=icp.company_sizes,
        funding_stages=icp.funding_stages,
        locations=icp.locations,
        titles=icp.titles,
        created_at=icp.created_at,
        updated_at=icp.updated_at
    )


@router.delete("/icp-profiles/{icp_id}")
async def delete_icp_profile(
    icp_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an ICP profile"""
    result = await db.execute(
        select(IdealCustomerProfile)
        .where(
            IdealCustomerProfile.id == icp_id,
            IdealCustomerProfile.user_id == current_user.id
        )
    )
    
    icp = result.scalar_one_or_none()
    if not icp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ICP profile not found"
        )
    
    await db.delete(icp)
    await db.commit()
    
    return {"message": "ICP profile deleted successfully"}