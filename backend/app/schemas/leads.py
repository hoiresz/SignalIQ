from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class LeadData(BaseModel):
    entity_type: str = "company"
    data: Dict[str, Any]


class LeadGenerationRequest(BaseModel):
    query: str
    conversation_id: str
    user_id: str


class StoredLead(BaseModel):
    id: str
    entity_type: str
    data: Dict[str, Any]


class LeadGenerationResponse(BaseModel):
    message: str
    leads: List[StoredLead]
    lead_table_id: str


class ConversationLead(BaseModel):
    id: str
    type: str
    name: str
    data: Dict[str, Any]
    createdAt: datetime


class ConversationLeadsResponse(BaseModel):
    leads: List[ConversationLead]
    columns: List[str]