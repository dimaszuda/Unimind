from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.ai_client import get_chat_completion, reflection_service, Reflection

router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    name: str
    message: str


class ChatResponse(BaseModel):
    reply: str

class ReflectionRequest(BaseModel):
    name: str
    question: str
    answer: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = get_chat_completion(request.name, request.message)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return ChatResponse(reply=result.feedback)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/reflection", response_model=Reflection)
async def handle_reflection(request: ReflectionRequest):
    try:
        result = reflection_service(request.name, request.question, request.answer)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return Reflection(
            feedback=result.feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
