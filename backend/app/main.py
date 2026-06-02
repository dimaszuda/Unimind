from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, session, level_one

app = FastAPI(title="Unimind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://unimind.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(session.router, prefix="/log-session", tags=["session"])
app.include_router(level_one.router, prefix="/level-one", tags=["level-one"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
