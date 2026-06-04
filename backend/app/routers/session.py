import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def _get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    return create_client(url, key)


class SessionLog(BaseModel):
    student_id: str
    time_spent_seconds: int
    chat_history: list[dict]


@router.post("")
async def log_session(payload: SessionLog):
    try:
        data = {
            "student_id": payload.student_id,
            "time_spent_seconds": payload.time_spent_seconds,
            "chat_history": payload.chat_history,
        }
        supabase = _get_supabase()
        supabase.table("session_logs").insert(data).execute()
        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
