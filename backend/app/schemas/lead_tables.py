from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


# Lead Table schemas
class LeadTableBase(BaseModel):
    name: str
    description: Optional[str] = None


class LeadTableCreate(LeadTableBase):
    pass


class LeadTableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class LeadTableResponse(LeadTableBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Lead Row Data
class LeadRowData(BaseModel):
    id: str
    entity_type: str
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Lead Table with Data
class LeadTableWithData(LeadTableResponse):
    columns: List[str]
    rows: List[LeadRowData]

    class Config:
        from_attributes = True