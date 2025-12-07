import uuid
import logging
from pathlib import Path
from typing import List, Dict

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request

from .config import OUTPUT_DIR, LLM_CONFIG, TTS_MODELS, TTS_DEFAULT_MODEL
from .db import Database
from .ollama_service import OllamaService
from .stt_service import WhisperService
from .tts_service import TTSService
from .schemas import (
    SessionCreateRequest,
    SessionCreateResponse,
    ProcessAudioResponse,
    TextMessageRequest,
    ChatHistoryResponse,
    Message,
)

app = FastAPI(title="Speech Coach")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("speech_coach")

# CORS (open for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = Database()
ollama_service = OllamaService()
whisper_service = WhisperService()
tts_service = TTSService()

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

logger.info(f"TTS_DEFAULT_MODEL: {TTS_DEFAULT_MODEL}")

def build_chat_history(session_id: str) -> List[Dict[str, str]]:
    """Convert stored messages to Ollama chat format."""
    messages = db.get_messages(session_id)
    chat_messages = []
    for msg in messages:
        role = "assistant" if msg["sender"] == "coach" else "user"
        content = msg["text"] or ""
        chat_messages.append({"role": role, "content": content})
    return chat_messages


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/session", response_model=SessionCreateResponse)
def create_session(payload: SessionCreateRequest):
    logger.info("Creating session mode=%s", payload.mode)
    if payload.mode not in {"call", "chat"}:
        raise HTTPException(status_code=400, detail="mode must be 'call' or 'chat'")
    session_id = str(uuid.uuid4())
    db.add_session(session_id, payload.mode)
    logger.info("Session created id=%s mode=%s", session_id, payload.mode)
    return SessionCreateResponse(session_id=session_id)


@app.post("/api/process_audio", response_model=ProcessAudioResponse)
def process_audio(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    model: str | None = Form(None),
    speaker: str | None = Form(None),
    tts_model: str | None = Form(None),
    call_mode: bool = Form(False),
):
    logger.info(
        "process_audio start session_id=%s model=%s speaker=%s tts_model=%s call_mode=%s filename=%s",
        session_id,
        model,
        speaker,
        tts_model,
        call_mode,
        audio.filename,
    )
    if not db.session_exists(session_id):
        db.add_session(session_id, mode="call")

    # Transcribe user audio
    user_text = whisper_service.transcribe_upload(audio)
    logger.info("Transcription done len=%s", len(user_text))
    db.add_message(session_id=session_id, sender="user", text=user_text)

    # Build context and query LLM
    history = build_chat_history(session_id)
    history.append({"role": "user", "content": user_text})
    coach_reply = ollama_service.chat(history, model=model)
    logger.info("LLM reply len=%s", len(coach_reply))

    # Synthesize coach reply
    tts_path = tts_service.synthesize(coach_reply, speaker=speaker, model=tts_model)
    logger.info("TTS synthesized path=%s", tts_path)
    audio_url = f"/output/{tts_path.name}"

    db.add_message(session_id=session_id, sender="coach", text=coach_reply, audio_path=str(tts_path))

    return ProcessAudioResponse(
        session_id=session_id,
        user_transcript=user_text,
        coach_reply=coach_reply,
        coach_audio_url=audio_url,
    )


@app.post("/api/send_text", response_model=ProcessAudioResponse)
def send_text(payload: TextMessageRequest):
    logger.info(
        "send_text start session_id=%s model=%s speaker=%s tts_model=%s",
        payload.session_id,
        payload.model,
        payload.speaker,
        payload.tts_model,
    )
    if not db.session_exists(payload.session_id):
        db.add_session(payload.session_id, mode="chat")

    db.add_message(session_id=payload.session_id, sender="user", text=payload.text)
    history = build_chat_history(payload.session_id)
    history.append({"role": "user", "content": payload.text})
    coach_reply = ollama_service.chat(history, model=payload.model)
    logger.info("LLM reply len=%s", len(coach_reply))
    tts_path = tts_service.synthesize(coach_reply, speaker=payload.speaker, model=payload.tts_model)
    logger.info("TTS synthesized path=%s", tts_path)
    audio_url = f"/output/{tts_path.name}"

    db.add_message(session_id=payload.session_id, sender="coach", text=coach_reply, audio_path=str(tts_path))

    return ProcessAudioResponse(
        session_id=payload.session_id,
        user_transcript=payload.text,
        coach_reply=coach_reply,
        coach_audio_url=audio_url,
    )


@app.get("/api/chat/history", response_model=ChatHistoryResponse)
def chat_history(session_id: str):
    logger.info("chat_history session_id=%s", session_id)
    if not db.session_exists(session_id):
        raise HTTPException(status_code=404, detail="Unknown session")
    messages = [Message(**m) for m in db.get_messages(session_id)]
    return ChatHistoryResponse(session_id=session_id, messages=messages)


@app.get("/api/models")
def models_info():
    tts_models = []
    for m in TTS_MODELS:
        tts_models.append(
            {
                "id": m.get("model"),
                "full_model_name": m.get("full_model_name"),
                "language": m.get("language"),
                "speakers": m.get("available_speaker_ids"),
                "default": m.get("default", False),
            }
        )
    llm_models = []
    for tier in LLM_CONFIG.get("hardware_tiers", []):
        for m in tier.get("models", []):
            llm_models.append(
                {
                    "name": m.get("name"),
                    "tag": m.get("ollama_tag"),
                    "role": m.get("role"),
                    "tier": tier.get("tier_id"),
                    "primary": m.get("is_primary_recommendation", False),
                }
            )
    return {
        "default_model": ollama_service.default_model,
        "llm_models": llm_models,
        "tts_models": tts_models,
        "default_tts_model": TTS_DEFAULT_MODEL.get("model"),
        "speakers": TTS_DEFAULT_MODEL.get("available_speaker_ids", []),
    }


