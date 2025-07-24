from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    poolclass=NullPool,  # Use NullPool for serverless environments
    future=True,
)

# Create async session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session"""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables"""
    from app.models.base import Base
    
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from app.models import (
            User, Conversation, Message, Lead, UserProfile,
            IdealCustomerProfile, LeadSignal, LeadTable,
            LeadColumn, LeadRow, LeadCell
        )
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)