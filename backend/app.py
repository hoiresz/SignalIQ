from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
from supabase import create_client, Client
import json
from datetime import datetime
import uuid
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

class LeadGenerator:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    def generate_leads(self, query: str, existing_columns: List[str] = None, context: Dict = None) -> Dict[str, Any]:
        """Generate leads based on natural language query"""
        
        system_prompt = """You are SignalIQ, an AI assistant that helps users find B2B leads (companies and people) based on their criteria.

Your job is to:
1. Understand the user's query and extract search criteria
2. Generate realistic lead data that matches their requirements
3. Return structured data with appropriate columns
4. Support follow-up requests to add columns or find more leads

When generating leads:
- Create realistic company names, funding amounts, locations, etc.
- Include relevant fields like industry, funding stage, employee count, website
- For people, include title, company, LinkedIn, email, experience
- Make data diverse and realistic
- Support dynamic column addition based on user requests

Return your response in this JSON format:
{
  "message": "Found X companies/people matching your criteria...",
  "leads": [
    {
      "entity_type": "company" or "person",
      "data": {
        "Name": "Company/Person Name",
        "Industry": "...",
        "Funding": "...",
        // ... other relevant fields
      }
    }
  ],
  "suggested_columns": ["Name", "Industry", "Funding", "Location", "Website"]
}
"""

        user_prompt = f"""
Query: {query}

Context:
- Existing columns: {existing_columns or []}
- Previous context: {context or {}}

Please generate relevant leads based on this query. If this is a follow-up request (like "add CEO info" or "find 20 more"), build upon the existing structure.
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"Error generating leads: {str(e)}")
            return {
                "message": "I encountered an error while processing your request. Please try again.",
                "leads": [],
                "suggested_columns": []
            }

lead_generator = LeadGenerator()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/api/generate-leads', methods=['POST'])
def generate_leads():
    try:
        data = request.get_json()
        query = data.get('query', '')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id')
        
        if not query or not conversation_id or not user_id:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Get existing lead table for this conversation
        lead_table = get_or_create_lead_table(conversation_id, user_id)
        
        # Get existing columns
        existing_columns = get_table_columns(lead_table['id'])
        
        # Generate leads using OpenAI
        ai_response = lead_generator.generate_leads(
            query=query,
            existing_columns=[col['name'] for col in existing_columns],
            context={"conversation_id": conversation_id}
        )
        
        # Store leads in database
        stored_leads = store_leads_in_table(
            lead_table['id'],
            ai_response['leads'],
            ai_response.get('suggested_columns', [])
        )
        
        return jsonify({
            "message": ai_response['message'],
            "leads": stored_leads,
            "lead_table_id": lead_table['id']
        })
        
    except Exception as e:
        logger.error(f"Error in generate_leads: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def get_or_create_lead_table(conversation_id: str, user_id: str) -> Dict:
    """Get existing lead table for conversation or create new one"""
    
    # Check if conversation already has a lead table
    result = supabase.table('conversations').select('lead_table_id').eq('id', conversation_id).single().execute()
    
    if result.data and result.data.get('lead_table_id'):
        # Get existing lead table
        table_result = supabase.table('lead_tables').select('*').eq('id', result.data['lead_table_id']).single().execute()
        return table_result.data
    
    # Create new lead table
    table_data = {
        'user_id': user_id,
        'conversation_id': conversation_id,
        'name': f'Leads - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
        'description': 'AI-generated leads table'
    }
    
    table_result = supabase.table('lead_tables').insert(table_data).execute()
    lead_table = table_result.data[0]
    
    # Update conversation with lead_table_id
    supabase.table('conversations').update({'lead_table_id': lead_table['id']}).eq('id', conversation_id).execute()
    
    return lead_table

def get_table_columns(lead_table_id: str) -> List[Dict]:
    """Get all columns for a lead table"""
    result = supabase.table('lead_columns').select('*').eq('lead_table_id', lead_table_id).order('display_order').execute()
    return result.data

def store_leads_in_table(lead_table_id: str, leads: List[Dict], suggested_columns: List[str]) -> List[Dict]:
    """Store leads data in the flexible table structure"""
    
    # Get existing columns
    existing_columns = get_table_columns(lead_table_id)
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
            result = supabase.table('lead_columns').insert(col_data).execute()
            column_map[col_name] = result.data[0]['id']
    
    stored_leads = []
    
    for lead in leads:
        # Create lead row
        row_data = {
            'lead_table_id': lead_table_id,
            'entity_type': lead.get('entity_type', 'company')
        }
        row_result = supabase.table('lead_rows').insert(row_data).execute()
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
            supabase.table('lead_cells').insert(cells_to_insert).execute()
        
        stored_leads.append({
            'id': row_id,
            'entity_type': lead.get('entity_type', 'company'),
            'data': lead.get('data', {})
        })
    
    return stored_leads

@app.route('/api/conversations/<conversation_id>/leads', methods=['GET'])
def get_conversation_leads(conversation_id):
    """Get all leads for a conversation in the flexible format"""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({"error": "User ID required"}), 401
        
        # Get lead table for conversation
        conv_result = supabase.table('conversations').select('lead_table_id').eq('id', conversation_id).eq('user_id', user_id).single().execute()
        
        if not conv_result.data or not conv_result.data.get('lead_table_id'):
            return jsonify({"leads": [], "columns": []})
        
        lead_table_id = conv_result.data['lead_table_id']
        
        # Get columns
        columns = get_table_columns(lead_table_id)
        
        # Get rows with their cell data
        rows_result = supabase.table('lead_rows').select('*').eq('lead_table_id', lead_table_id).execute()
        
        leads = []
        for row in rows_result.data:
            # Get cells for this row
            cells_result = supabase.table('lead_cells').select('*, lead_columns(name)').eq('row_id', row['id']).execute()
            
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
        
        return jsonify({
            "leads": leads,
            "columns": [col['name'] for col in columns]
        })
        
    except Exception as e:
        logger.error(f"Error getting conversation leads: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)