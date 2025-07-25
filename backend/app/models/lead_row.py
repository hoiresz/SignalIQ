from sqlalchemy import Column, String, DateTime, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base


class EntityType(str, enum.Enum):
    """Entity type enumeration for lead rows"""
    COMPANY = "company"
    PERSON = "person"


class LeadRow(Base):
    """Data Row model - represents a single row in a data table"""
    __tablename__ = "lead_rows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_table_id = Column(UUID(as_uuid=True), ForeignKey("lead_tables.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(Enum(EntityType), default=EntityType.COMPANY, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    data_table = relationship("LeadTable", back_populates="rows")
    cells = relationship("LeadCell", back_populates="row", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DataRow(id={self.id}, entity_type={self.entity_type}, data_table_id={self.data_table_id})>"