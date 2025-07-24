from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class IdealCustomerProfile(Base):
    """Ideal Customer Profile model - defines target customer criteria"""
    __tablename__ = "ideal_customer_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, default="My ICP Profile")
    company_sizes = Column(ARRAY(String), default=[], nullable=True)
    funding_stages = Column(ARRAY(String), default=[], nullable=True)
    locations = Column(ARRAY(String), default=[], nullable=True)
    titles = Column(String, default="", nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    company_info = Column(String, default="", nullable=True)
    target_customers = Column(String, default="", nullable=True)
    intent_signals = Column(String, default="", nullable=True)
    solution_products = Column(String, default="", nullable=True)
    target_region = Column(String, default="", nullable=True)

    # Relationships
    user = relationship("User", back_populates="ideal_customer_profiles")
    lead_signals = relationship("LeadSignal", back_populates="icp", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<IdealCustomerProfile(id={self.id}, name={self.name}, user_id={self.user_id})>"