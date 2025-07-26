from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


# Data Table schemas
class DataTableBase(BaseModel):
    name: str
    description: Optional[str] = None
    table_type: Optional[str] = "companies"
    default_columns: Optional[List[Dict[str, Any]]] = []


class DataTableCreate(DataTableBase):
    pass


class DataTableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    table_type: Optional[str] = None


class DataTableResponse(DataTableBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Data Row Data
class DataRowData(BaseModel):
    id: str
    entity_type: str
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Data Table with Data
class DataTableWithData(DataTableResponse):
    columns: List[str]
    rows: List[DataRowData]

    class Config:
        from_attributes = True