from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.ai_client import get_chat_completion, reflection_service, get_summary, lab_chat

router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    name: str
    message: str
    history: List[Message] = []

class LabChatRequest(BaseModel):
    name: str
    message: str
    lab: str
    history: List[Message] = []

class ChatResponse(BaseModel):
    reply: str
    input_tokens: int
    output_tokens: int
    total_tokens: int

class Reflection(BaseModel):
    feedback: str
    input_tokens: int
    output_tokens: int
    total_tokens: int

class ReflectionRequest(BaseModel):
    name: str
    last_question: bool
    question: str
    answer: str
    history: List[Message] = []

class SummaryRequest(BaseModel):
    name: str
    history: List[Message] = []


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        history = [m.model_dump() for m in request.history]
        result, input_tokens, output_tokens, total_tokens = get_chat_completion(request.name, request.message, history=history)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return ChatResponse(
            reply=result.feedback,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/reflection", response_model=Reflection)
async def handle_reflection(request: ReflectionRequest):
    try:
        history = [m.model_dump() for m in request.history]
        result, input_tokens, output_tokens, total_tokens = reflection_service(request.name, request.last_question, request.question, request.answer, history=history)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return Reflection(
            feedback=result.feedback,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/summary", response_model=Reflection)
async def handle_summary(request: SummaryRequest):
    try:
        history = [m.model_dump() for m in request.history]
        result, input_tokens, output_tokens, total_tokens = get_summary(request.name, history=history)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return Reflection(
            feedback=result.feedback,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/lab-chat", response_model=ChatResponse)
async def lab_chat_endpoint(request: LabChatRequest):
    try:
        history = [m.model_dump() for m in request.history]
        result, input_tokens, output_tokens, total_tokens = lab_chat(request.name, request.message, request.lab, history=history)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Model returned unparseable response")
        
        return ChatResponse(
            reply=result.feedback,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
