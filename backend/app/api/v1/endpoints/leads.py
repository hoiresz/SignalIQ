from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging

from app.schemas.leads import LeadGenerationRequest, LeadGenerationResponse, ConversationLeadsResponse
from app.services.lead_generator import LeadGeneratorService
from app.services.supabase_service import SupabaseService

router = APIRouter()
logger = logging.getLogger(__name__)

lead_service = LeadGeneratorService()
supabase_service = SupabaseService()


@router.post("/generate", response_model=LeadGenerationResponse)
async def generate_leads(request: LeadGenerationRequest):
    """Generate leads based on natural language query using OpenAI"""
    try:
        if not request.query or not request.conversation_id or not request.user_id:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Get or create lead table for this conversation
        lead_table = await supabase_service.get_or_create_lead_table(
            request.conversation_id, 
            request.user_id
        )
        
        # Get existing columns
        existing_columns = await supabase_service.get_table_columns(lead_table['id'])
        
        # Generate leads using OpenAI
        ai_response = await lead_service.generate_leads(
            query=request.query,
            existing_columns=[col['name'] for col in existing_columns],
            context={"conversation_id": request.conversation_id}
        )
        
        # Store leads in database
        stored_leads = await supabase_service.store_leads_in_table(
            lead_table['id'],
            ai_response['leads'],
            ai_response.get('suggested_columns', [])
        )
        
        return LeadGenerationResponse(
            message=ai_response['message'],
            leads=stored_leads,
            lead_table_id=lead_table['id']
        )
        
    except Exception as e:
        logger.error(f"Error in generate_leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/conversations/{conversation_id}", response_model=ConversationLeadsResponse)
async def get_conversation_leads(
    conversation_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """Get all leads for a conversation"""
    try:
        if not x_user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        leads_data = await supabase_service.get_conversation_leads(conversation_id, x_user_id)
        
        return ConversationLeadsResponse(
            leads=leads_data["leads"],
            columns=leads_data["columns"]
        )
        
    except Exception as e:
        logger.error(f"Error getting conversation leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")