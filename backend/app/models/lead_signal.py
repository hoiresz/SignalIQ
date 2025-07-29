from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, func, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from .base import Base


class SignalStatus(str, enum.Enum):
    """Signal status enumeration"""
    DEPLOYED = "deployed"
    SEARCHING = "searching"
    COMPLETED = "completed"


class LeadSignal(Base):
    """Signal model - defines criteria for identifying potential prospects"""
    __tablename__ = "lead_signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    icp_id = Column(UUID(as_uuid=True), ForeignKey("ideal_customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(SignalStatus), default=SignalStatus.DEPLOYED, nullable=False, index=True)
    criteria = Column(JSONB, default={}, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="signals")
    icp = relationship("IdealCustomerProfile", back_populates="signals")

    def __repr__(self):