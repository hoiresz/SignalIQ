from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase
from typing import Any

# SQLAlchemy 2.x style
class Base(DeclarativeBase):
    """Base class for all database models"""
    pass

# For compatibility with older SQLAlchemy patterns
metadata = Base.metadata