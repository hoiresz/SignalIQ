from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_with_profile(self, db: AsyncSession, *, user_id: UUID) -> Optional[User]:
        """Get user with profile data"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.user_profile))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_from_auth(self, db: AsyncSession, *, user_id: UUID, email: str) -> User:
        """Create user record from Supabase auth data"""
        db_obj = User(id=user_id, email=email)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


user = CRUDUser(User)