from sqlalchemy import Column, String, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base


class LeadType(str, enum.Enum):
    """Lead type enumeration"""
    COMPANY = "company"
    PERSON = "person"


class Lead(Base):
    """Lead model - represents individual leads (companies/people) found by AI"""
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(Enum(LeadType), nullable=False, index=True)
    name = Column(String, nullable=False)
    data = Column(JSONB, nullable=True, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="leads")
    message = relationship("Message")

    def __repr__(self):
        return f"<Lead(id={self.id}, name={self.name}, type={self.type})>"