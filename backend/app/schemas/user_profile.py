from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# User Profile schemas
class UserProfileBase(BaseModel):
    company_website: Optional[str] = None
    onboarding_completed: Optional[bool] = False


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ICP schemas
class ICPBase(BaseModel):
    name: str
    solution_products: Optional[str] = ""
    target_region: Optional[str] = ""
    target_customers: Optional[str] = ""
    company_sizes: Optional[List[str]] = []
    funding_stages: Optional[List[str]] = []
    locations: Optional[List[str]] = []
    titles: Optional[str] = ""


class ICPCreate(ICPBase):
    pass


class ICPUpdate(ICPBase):
    name: Optional[str] = None


class ICPResponse(ICPBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Lead Signal schemas
class LeadSignalBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "deployed"
    is_active: Optional[bool] = True
    signal_type: Optional[str] = "AI_GENERATED"
    criteria: Optional[dict] = {}


class LeadSignalCreate(LeadSignalBase):
    icp_id: str


class LeadSignalUpdate(LeadSignalBase):
    name: Optional[str] = None


class LeadSignalResponse(LeadSignalBase):
    id: str
    user_id: str
    icp_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True