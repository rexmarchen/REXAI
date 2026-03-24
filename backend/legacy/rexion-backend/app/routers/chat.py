from fastapi import APIRouter, HTTPException, status
from ..models.chat_models import ChatRequest, ChatResponse
from ..services.llm_service import llm_service

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Send a message to REXION and get a reply.
    """
    try:
        reply, model_used = await llm_service.generate_response(
            user_message=request.message,
            history=request.history,
            model=request.model
        )
        return ChatResponse(reply=reply, model_used=model_used)
    
    except Exception as e:
        # Log the error (already done in service)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is currently unavailable. Please try again later."
        )