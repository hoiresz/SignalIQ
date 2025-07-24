from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


# Conversation schemas
class ConversationBase(BaseModel):
    title: Optional[str] = None


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int
    lead_count: int

    class Config:
        from_attributes = True


# Message schemas
class MessageBase(BaseModel):
    type: str  # 'user', 'assistant', 'system'
    content: str


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime

    class Config:
        from_attributes = True