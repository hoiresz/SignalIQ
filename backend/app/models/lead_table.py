from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class LeadTable(Base):
    """Data Table model - represents a collection of data with dynamic schema"""
    __tablename__ = "lead_tables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    table_type = Column(String, default="companies", nullable=True)
    default_columns = Column(JSONB, default=[], nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="data_tables")
    conversation = relationship("Conversation", foreign_keys=[conversation_id])
    columns = relationship("LeadColumn", back_populates="data_table", cascade="all, delete-orphan")
    rows = relationship("LeadRow", back_populates="data_table", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DataTable(id={self.id}, name={self.name}, user_id={self.user_id})>"