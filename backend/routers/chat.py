"""
TrustTrace AI - Chatbot Router
Endpoint:
- POST /api/chat
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.auth import get_current_user
from backend.services.chat_service import TrustTraceChatbot

router = APIRouter(prefix="/api/chat", tags=["TrustTrace AI Assistant"])
chatbot = TrustTraceChatbot()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    response: str
    citations: list
    grounded_records: dict
    model_versions: dict
    disclaimer: str

@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user)
):
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    result = chatbot.answer_query(payload.query, db, user)
    return result
