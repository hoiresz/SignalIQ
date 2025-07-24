from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageType
from app.models.lead import Lead
from app.schemas.conversation import (
    ConversationCreate, ConversationUpdate, ConversationResponse,
    ConversationSummary, MessageCreate, MessageResponse
)

router = APIRouter()


@router.get("/", response_model=List[ConversationSummary])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user with summary info"""
    # Get conversations with message and lead counts
    result = await db.execute(
        select(
            Conversation,
            func.count(Message.id).label('message_count'),
            func.count(Lead.id).label('lead_count')
        )
        .outerjoin(Message)
        .outerjoin(Lead)
        .where(Conversation.user_id == current_user.id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
    )
    
    conversations_data = result.all()
    
    return [
        ConversationSummary(
            id=str(conv.id),
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=message_count or 0,
            lead_count=lead_count or 0
        )
        for conv, message_count, lead_count in conversations_data
    ]


@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    conversation_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation"""
    conversation = Conversation(
        user_id=current_user.id,
        title=conversation_in.title or "New Search Session"
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    # Add welcome message
    welcome_message = Message(
        conversation_id=conversation.id,
        type=MessageType.SYSTEM,
        content="Welcome to SignalIQ! Ask me to find companies or people based on your criteria."
    )
    
    db.add(welcome_message)
    await db.commit()
    
    return ConversationResponse(
        id=str(conversation.id),
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        user_id=str(conversation.user_id)
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation"""
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse(
        id=str(conversation.id),
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        user_id=str(conversation.user_id)
    )


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages for a conversation"""
    # Verify conversation belongs to user
    conv_result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    
    if not conv_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    
    messages = result.scalars().all()
    
    return [
        MessageResponse(
            id=str(msg.id),
            conversation_id=str(msg.conversation_id),
            type=msg.type.value,
            content=msg.content,
            created_at=msg.created_at
        )
        for msg in messages
    ]


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    conversation_id: UUID,
    message_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new message in a conversation"""
    # Verify conversation belongs to user
    conv_result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
    )
    
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        type=MessageType(message_in.type),
        content=message_in.content
    )
    
    db.add(message)
    
    # Update conversation timestamp
    conversation.updated_at = func.now()
    
    await db.commit()
    await db.refresh(message)
    
    return MessageResponse(
        id=str(message.id),
        conversation_id=str(message.conversation_id),
        type=message.type.value,
        content=message.content,
        created_at=message.created_at
    )