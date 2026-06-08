import logging
from fastapi import APIRouter
from pydantic import BaseModel
from app.sheets_client import append_chat_log, append_reflection_log

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatLogRequest(BaseModel):
    name: str
    lab: str            # one | two | three | refleksi
    turn: int
    timestamp: str      # ISO-8601 from frontend
    student_message: str
    ai_message: str
    response_time: float  # seconds


class ReflectionLogRequest(BaseModel):
    name: str
    question: str
    student_answer: str
    ai_feedback: str
    response_time: float  # seconds


@router.post("/chat")
async def log_chat(request: ChatLogRequest):
    """Fire-and-forget endpoint — errors are logged but never bubble to the user."""
    try:
        append_chat_log(
            name=request.name,
            lab=request.lab,
            turn=request.turn,
            timestamp=request.timestamp,
            student_message=request.student_message,
            ai_message=request.ai_message,
            response_time=request.response_time,
        )
    except Exception as e:
        logger.warning("sheets log_chat failed: %s", e)
    return {"status": "ok"}


@router.post("/reflection")
async def log_reflection(request: ReflectionLogRequest):
    """Fire-and-forget endpoint — errors are logged but never bubble to the user."""
    try:
        append_reflection_log(
            name=request.name,
            question=request.question,
            student_answer=request.student_answer,
            ai_feedback=request.ai_feedback,
            response_time=request.response_time,
        )
    except Exception as e:
        logger.warning("sheets log_reflection failed: %s", e)
    return {"status": "ok"}
