from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant" or "system"
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's current message")
    # Optional: send full conversation history for context
    history: List[ChatMessage] = Field(default_factory=list)
    # Optional: override model per request
    model: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    model_used: str