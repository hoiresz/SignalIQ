from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from .base import Base


class User(Base):
    """User model - represents authenticated users from Supabase Auth"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Note: Password and auth-related fields are handled by Supabase Auth
    # We only store the user reference and profile data
    
    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    user_profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ideal_customer_profiles = relationship("IdealCustomerProfile", back_populates="user", cascade="all, delete-orphan")
    signals = relationship("LeadSignal", back_populates="user", cascade="all, delete-orphan")
    data_tables = relationship("LeadTable", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"