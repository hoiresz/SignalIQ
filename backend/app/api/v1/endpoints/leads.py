from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging

from app.schemas.leads import LeadGenerationRequest, LeadGenerationResponse, ConversationLeadsResponse
from app.services.lead_generator import LeadGeneratorService
from app.services.lead_service import LeadService

router = APIRouter()
logger = logging.getLogger(__name__)

lead_service = LeadGeneratorService()
lead_data_service = LeadService()


@router.post("/generate", response_model=LeadGenerationResponse)
async def generate_leads(
    request: LeadGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate leads based on natural language query using OpenAI"""
    try:
        if not request.query or not request.lead_table_id:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Verify lead table belongs to user
        lead_table = await lead_data_service.get_lead_table(
            db, request.lead_table_id, current_user.id
        )
        
        if not lead_table:
            raise HTTPException(status_code=404, detail="Lead table not found")
        
        # Get existing columns
        existing_columns = await lead_data_service.get_table_columns(
            db, lead_table.id
        )
        
        # Generate leads using OpenAI
        ai_response = await lead_service.generate_leads(
            query=request.query,
            existing_columns=[col.name for col in existing_columns],
            context={"lead_table_id": str(lead_table.id)}
        )
        
        # Store leads in database
        stored_leads = await lead_data_service.store_leads_in_table(
            db,
            lead_table.id,
            ai_response['leads'],
            ai_response.get('suggested_columns', [])
        )
        
        return LeadGenerationResponse(
            message=ai_response['message'],
            leads=stored_leads,
            lead_table_id=str(lead_table.id)
        )
        
    except Exception as e:
        logger.error(f"Error in generate_leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tables/{table_id}", response_model=ConversationLeadsResponse)
async def get_table_leads(
    table_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all leads for a table"""
    try:
        leads_data = await lead_data_service.get_table_leads(
            db, table_id, current_user.id
        )
        
        return ConversationLeadsResponse(
            leads=leads_data["leads"],
            columns=leads_data["columns"]
        )
        
    except Exception as e:
        logger.error(f"Error getting table leads: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")