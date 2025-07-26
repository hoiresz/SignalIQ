from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, func, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base


class SignalType(str, enum.Enum):
    """Signal type enumeration"""
    AI_GENERATED = "ai_generated"
    CUSTOM = "custom"


class LeadSignal(Base):
    """Signal model - defines criteria for identifying potential prospects"""
    __tablename__ = "lead_signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    icp_id = Column(UUID(as_uuid=True), ForeignKey("ideal_customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    signal_type = Column(Enum(SignalType), default=SignalType.CUSTOM, nullable=False, index=True)
    criteria = Column(JSONB, default={}, nullable=True)
    is_active = Column(Boolean, default=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="signals")
    icp = relationship("IdealCustomerProfile", back_populates="signals")

    def __repr__(self):
        return f"<Signal(id={self.id}, name={self.name}, signal_type={self.signal_type})>"