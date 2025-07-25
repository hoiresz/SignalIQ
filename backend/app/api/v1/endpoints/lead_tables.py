from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.lead_table import LeadTable
from app.models.lead_column import LeadColumn
from app.models.lead_row import LeadRow
from app.models.lead_cell import LeadCell
from app.schemas.lead_tables import (
    LeadTableCreate, LeadTableUpdate, LeadTableResponse,
    LeadTableWithData, LeadRowData
)

router = APIRouter()


@router.get("/", response_model=List[LeadTableResponse])
async def get_lead_tables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all lead tables for the current user"""
    result = await db.execute(
        select(LeadTable)
        .where(LeadTable.user_id == current_user.id)
        .order_by(LeadTable.updated_at.desc())
    )
    
    tables = result.scalars().all()
    
    return [
        LeadTableResponse(
            id=str(table.id),
            user_id=str(table.user_id),
            name=table.name,
            description=table.description,
            created_at=table.created_at,
            updated_at=table.updated_at
        )
        for table in tables
    ]


@router.post("/", response_model=LeadTableResponse)
async def create_lead_table(
    table_in: LeadTableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lead table"""
    lead_table = LeadTable(
        user_id=current_user.id,
        name=table_in.name,
        description=table_in.description
    )
    
    db.add(lead_table)
    await db.commit()
    await db.refresh(lead_table)
    
    return LeadTableResponse(
        id=str(lead_table.id),
        user_id=str(lead_table.user_id),
        name=lead_table.name,
        description=lead_table.description,
        created_at=lead_table.created_at,
        updated_at=lead_table.updated_at
    )


@router.get("/{table_id}", response_model=LeadTableWithData)
async def get_lead_table(
    table_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific lead table with all its data"""
    # Get the table
    result = await db.execute(
        select(LeadTable)
        .where(
            LeadTable.id == table_id,
            LeadTable.user_id == current_user.id
        )
    )
    
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead table not found"
        )
    
    # Get columns
    columns_result = await db.execute(
        select(LeadColumn)
        .where(LeadColumn.lead_table_id == table_id)
        .order_by(LeadColumn.display_order)
    )
    columns = columns_result.scalars().all()
    
    # Get rows with cells
    rows_result = await db.execute(
        select(LeadRow)
        .where(LeadRow.lead_table_id == table_id)
        .order_by(LeadRow.created_at)
    )
    rows = rows_result.scalars().all()
    
    # Get all cells for this table
    cells_result = await db.execute(
        select(LeadCell)
        .join(LeadRow)
        .where(LeadRow.lead_table_id == table_id)
    )
    cells = cells_result.scalars().all()
    
    # Organize cells by row
    cells_by_row = {}
    for cell in cells:
        if cell.row_id not in cells_by_row:
            cells_by_row[cell.row_id] = {}
        cells_by_row[cell.row_id][cell.column_id] = cell.value
    
    # Build row data
    row_data = []
    for row in rows:
        row_cells = cells_by_row.get(row.id, {})
        data = {}
        for column in columns:
            data[column.name] = row_cells.get(column.id)
        
        row_data.append(LeadRowData(
            id=str(row.id),
            entity_type=row.entity_type.value,
            data=data,
            created_at=row.created_at,
            updated_at=row.updated_at
        ))
    
    return LeadTableWithData(
        id=str(table.id),
        user_id=str(table.user_id),
        name=table.name,
        description=table.description,
        created_at=table.created_at,
        updated_at=table.updated_at,
        columns=[col.name for col in columns],
        rows=row_data
    )


@router.put("/{table_id}", response_model=LeadTableResponse)
async def update_lead_table(
    table_id: UUID,
    table_update: LeadTableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a lead table"""
    result = await db.execute(
        select(LeadTable)
        .where(
            LeadTable.id == table_id,
            LeadTable.user_id == current_user.id
        )
    )
    
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead table not found"
        )
    
    # Update fields
    update_data = table_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(table, field, value)
    
    await db.commit()
    await db.refresh(table)
    
    return LeadTableResponse(
        id=str(table.id),
        user_id=str(table.user_id),
        name=table.name,
        description=table.description,
        created_at=table.created_at,
        updated_at=table.updated_at
    )


@router.delete("/{table_id}")
async def delete_lead_table(
    table_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a lead table"""
    result = await db.execute(
        select(LeadTable)
        .where(
            LeadTable.id == table_id,
            LeadTable.user_id == current_user.id
        )
    )
    
    table = result.scalar_one_or_none()
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead table not found"
        )
    
    await db.delete(table)
    await db.commit()
    
    return {"message": "Lead table deleted successfully"}