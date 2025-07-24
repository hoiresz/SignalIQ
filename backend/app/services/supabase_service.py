import json
import logging
from typing import Dict, List, Any
from datetime import datetime
from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.supabase_url, 
            settings.supabase_service_role_key
        )

    async def get_or_create_lead_table(self, conversation_id: str, user_id: str) -> Dict:
        """Get existing lead table for conversation or create new one"""
        
        # Check if conversation already has a lead table
        result = self.supabase.table('conversations').select('lead_table_id').eq('id', conversation_id).single().execute()
        
        if result.data and result.data.get('lead_table_id'):
            # Get existing lead table
            table_result = self.supabase.table('lead_tables').select('*').eq('id', result.data['lead_table_id']).single().execute()
            return table_result.data
        
        # Create new lead table
        table_data = {
            'user_id': user_id,
            'conversation_id': conversation_id,
            'name': f'Leads - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
            'description': 'AI-generated leads table'
        }
        
        table_result = self.supabase.table('lead_tables').insert(table_data).execute()
        lead_table = table_result.data[0]
        
        # Update conversation with lead_table_id
        self.supabase.table('conversations').update({'lead_table_id': lead_table['id']}).eq('id', conversation_id).execute()
        
        return lead_table

    async def get_table_columns(self, lead_table_id: str) -> List[Dict]:
        """Get all columns for a lead table"""
        result = self.supabase.table('lead_columns').select('*').eq('lead_table_id', lead_table_id).order('display_order').execute()
        return result.data

    async def store_leads_in_table(self, lead_table_id: str, leads: List[Dict], suggested_columns: List[str]) -> List[Dict]:
        """Store leads data in the flexible table structure"""
        
        # Get existing columns
        existing_columns = await self.get_table_columns(lead_table_id)
        column_map = {col['name']: col['id'] for col in existing_columns}
        
        # Create new columns if needed
        for col_name in suggested_columns:
            if col_name not in column_map:
                col_data = {
                    'lead_table_id': lead_table_id,
                    'name': col_name,
                    'column_type': 'text',
                    'display_order': len(column_map)
                }
                result = self.supabase.table('lead_columns').insert(col_data).execute()
                column_map[col_name] = result.data[0]['id']
        
        stored_leads = []
        
        for lead in leads:
            # Create lead row
            row_data = {
                'lead_table_id': lead_table_id,
                'entity_type': lead.get('entity_type', 'company')
            }
            row_result = self.supabase.table('lead_rows').insert(row_data).execute()
            row_id = row_result.data[0]['id']
            
            # Create cells for each data field
            cells_to_insert = []
            for field_name, field_value in lead.get('data', {}).items():
                if field_name in column_map:
                    cells_to_insert.append({
                        'row_id': row_id,
                        'column_id': column_map[field_name],
                        'value': json.dumps(field_value) if not isinstance(field_value, str) else field_value
                    })
            
            if cells_to_insert:
                self.supabase.table('lead_cells').insert(cells_to_insert).execute()
            
            stored_leads.append({
                'id': row_id,
                'entity_type': lead.get('entity_type', 'company'),
                'data': lead.get('data', {})
            })
        
        return stored_leads

    async def get_conversation_leads(self, conversation_id: str, user_id: str) -> Dict:
        """Get all leads for a conversation in the flexible format"""
        
        # Get lead table for conversation
        conv_result = self.supabase.table('conversations').select('lead_table_id').eq('id', conversation_id).eq('user_id', user_id).single().execute()
        
        if not conv_result.data or not conv_result.data.get('lead_table_id'):
            return {"leads": [], "columns": []}
        
        lead_table_id = conv_result.data['lead_table_id']
        
        # Get columns
        columns = await self.get_table_columns(lead_table_id)
        
        # Get rows with their cell data
        rows_result = self.supabase.table('lead_rows').select('*').eq('lead_table_id', lead_table_id).execute()
        
        leads = []
        for row in rows_result.data:
            # Get cells for this row
            cells_result = self.supabase.table('lead_cells').select('*, lead_columns(name)').eq('row_id', row['id']).execute()
            
            lead_data = {}
            for cell in cells_result.data:
                column_name = cell['lead_columns']['name']
                try:
                    # Try to parse JSON, fallback to string
                    value = json.loads(cell['value']) if cell['value'] else ''
                except:
                    value = cell['value'] or ''
                lead_data[column_name] = value
            
            leads.append({
                'id': row['id'],
                'type': row['entity_type'],
                'name': lead_data.get('Name', 'Unknown'),
                'data': lead_data,
                'createdAt': row['created_at']
            })
        
        return {
            "leads": leads,
            "columns": [col['name'] for col in columns]
        }