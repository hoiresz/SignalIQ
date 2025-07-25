import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.lead_table import LeadTable
from app.models.lead_column import LeadColumn
from app.models.lead_row import LeadRow
from app.models.lead_cell import LeadCell

logger = logging.getLogger(__name__)


class LeadService:
    """Service for managing lead tables and data"""

    async def get_lead_table(self, db: AsyncSession, table_id: str, user_id: UUID) -> Optional[LeadTable]:
        """Get a lead table by ID for a specific user"""
        result = await db.execute(
            select(LeadTable)
            .where(
                LeadTable.id == UUID(table_id),
                LeadTable.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def create_lead_table(self, db: AsyncSession, user_id: UUID, name: str, description: str = None) -> LeadTable:
        """Create a new lead table"""
        lead_table = LeadTable(
            user_id=user_id,
            name=name,
            description=description
        )
        
        db.add(lead_table)
        await db.commit()
        await db.refresh(lead_table)
        
        return lead_table

    async def get_table_columns(self, db: AsyncSession, table_id: UUID) -> List[LeadColumn]:
        """Get all columns for a lead table"""
        result = await db.execute(
            select(LeadColumn)
            .where(LeadColumn.lead_table_id == table_id)
            .order_by(LeadColumn.display_order)
        )
        return result.scalars().all()

    async def store_leads_in_table(self, 
                                  db: AsyncSession,
                                  table_id: UUID, 
                                  leads: List[Dict], 
                                  suggested_columns: List[str]) -> List[Dict]:
        """Store leads data in the flexible table structure"""
        
        # Get existing columns
        existing_columns = await self.get_table_columns(db, table_id)
        column_map = {col.name: col.id for col in existing_columns}
        
        # Create new columns if needed
        for col_name in suggested_columns:
            if col_name not in column_map:
                new_column = LeadColumn(
                    lead_table_id=table_id,
                    name=col_name,
                    column_type='text',
                    display_order=len(column_map)
                )
                db.add(new_column)
                await db.flush()  # Get the ID
                column_map[col_name] = new_column.id
        
        stored_leads = []
        
        for lead in leads:
            # Create lead row
            lead_row = LeadRow(
                lead_table_id=table_id,
                entity_type=lead.get('entity_type', 'company')
            )
            db.add(lead_row)
            await db.flush()  # Get the ID
            
            # Create cells for each data field
            for field_name, field_value in lead.get('data', {}).items():
                if field_name in column_map:
                    cell = LeadCell(
                        row_id=lead_row.id,
                        column_id=column_map[field_name],
                        value=field_value if isinstance(field_value, (str, int, float, bool, type(None))) else json.dumps(field_value)
                    )
                    db.add(cell)
            
            stored_leads.append({
                'id': str(lead_row.id),
                'entity_type': lead.get('entity_type', 'company'),
                'data': lead.get('data', {})
            })
        
        await db.commit()
        return stored_leads

    async def get_table_leads(self, db: AsyncSession, table_id: str, user_id: UUID) -> Dict:
        """Get all leads for a table in the flexible format"""
        
        # Verify table belongs to user
        table = await self.get_lead_table(db, table_id, user_id)
        if not table:
            return {"leads": [], "columns": []}
        
        # Get columns
        columns = await self.get_table_columns(db, table.id)
        
        # Get rows
        rows_result = await db.execute(
            select(LeadRow)
            .where(LeadRow.lead_table_id == table.id)
            .order_by(LeadRow.created_at)
        )
        rows = rows_result.scalars().all()
        
        # Get all cells for this table
        cells_result = await db.execute(
            select(LeadCell)
            .join(LeadRow)
            .where(LeadRow.lead_table_id == table.id)
        )
        cells = cells_result.scalars().all()
        
        # Organize cells by row
        cells_by_row = {}
        for cell in cells:
            if cell.row_id not in cells_by_row:
                cells_by_row[cell.row_id] = {}
            cells_by_row[cell.row_id][cell.column_id] = cell.value
        
        leads = []
        for row in rows:
            row_cells = cells_by_row.get(row.id, {})
            lead_data = {}
            
            for column in columns:
                value = row_cells.get(column.id)
                try:
                    # Try to parse JSON, fallback to string
                    if isinstance(value, str) and value.startswith(('{', '[')):
                        value = json.loads(value)
                except:
                    pass
                lead_data[column.name] = value or ''
            
            # Extract name from data
            name = lead_data.get('Name') or lead_data.get('name') or 'Unknown'
            
            leads.append({
                'id': str(row.id),
                'type': row.entity_type.value,
                'name': name,
                'data': lead_data,
                'createdAt': row.created_at.isoformat()
            })
        
        return {
            "leads": leads,
            "columns": [col.name for col in columns]
        }