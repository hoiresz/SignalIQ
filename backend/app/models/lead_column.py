from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class LeadColumn(Base):
    """Data Column model - defines columns in a data table"""
    __tablename__ = "lead_columns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_table_id = Column(UUID(as_uuid=True), ForeignKey("lead_tables.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    column_type = Column(String, default="text", nullable=True)
    display_order = Column(Integer, default=0, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    data_table = relationship("LeadTable", back_populates="columns")
    cells = relationship("LeadCell", back_populates="column", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DataColumn(id={self.id}, name={self.name}, data_table_id={self.data_table_id})>"