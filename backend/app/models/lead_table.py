from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class LeadTable(Base):
    """Lead Table model - represents a collection of leads with dynamic schema"""
    __tablename__ = "lead_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="lead_tables")
    conversation = relationship("Conversation")
    columns = relationship("LeadColumn", back_populates="lead_table", cascade="all, delete-orphan")
    rows = relationship("LeadRow", back_populates="lead_table", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LeadTable(id={self.id}, name={self.name}, user_id={self.user_id})>"