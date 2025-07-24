from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class LeadCell(Base):
    """Lead Cell model - represents individual cell data in the lead table"""
    __tablename__ = "lead_cells"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    row_id = Column(UUID(as_uuid=True), ForeignKey("lead_rows.id", ondelete="CASCADE"), nullable=False, index=True)
    column_id = Column(UUID(as_uuid=True), ForeignKey("lead_columns.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    row = relationship("LeadRow", back_populates="cells")
    column = relationship("LeadColumn", back_populates="cells")

    def __repr__(self):
        return f"<LeadCell(id={self.id}, row_id={self.row_id}, column_id={self.column_id})>"