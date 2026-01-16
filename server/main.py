import uuid
import logging
from pathlib import Path
from typing import List, Dict

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import OUTPUT_DIR, LLM_CONFIG, TTS_MODELS, TTS_DEFAULT_MODEL, STORAGE_CONFIG
from .db import Database
from .ollama_service import OllamaService
from .stt_service import WhisperService
from .tts_service import TTSService
from .storage import get_storage_provider
from .connection_manager import ConnectionManager
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
storage_provider = get_storage_provider(STORAGE_CONFIG, OUTPUT_DIR)
connection_manager = ConnectionManager(db, whisper_service, ollama_service, tts_service, storage_provider)

BASE_DIR = Path(__file__).resolve().parent

# Mount output directory for serving generated audio files
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

logger.info(f"TTS_DEFAULT_MODEL: {TTS_DEFAULT_MODEL}")
logger.info(f"Storage Provider: {type(storage_provider).__name__}")

def build_chat_history(session_id: str) -> List[Dict[str, str]]:
    """Convert stored messages to Ollama chat format."""
    messages = db.get_messages(session_id)
    chat_messages = []
    for msg in messages:
        role = "assistant" if msg["sender"] == "coach" else "user"
        content = msg["text"] or ""
        chat_messages.append({"role": role, "content": content})
    return chat_messages



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
async def process_audio(
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

    try:
        # Transcribe user audio
        user_text = await whisper_service.transcribe_upload(audio)
        logger.info("Transcription done len=%s", len(user_text))
        db.add_message(session_id=session_id, sender="user", text=user_text)

        logger.info("User text: %s", user_text)

        # Build context and query LLM
        history = build_chat_history(session_id)
        history.append({"role": "user", "content": user_text})
        
        try:
            coach_reply = await ollama_service.chat(history, model=model)
            logger.info("LLM reply len=%s", len(coach_reply))
        except Exception as e:
            logger.error("LLM failed: %s", e)
            raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

        # Synthesize coach reply
        try:
            tts_path = await tts_service.synthesize(coach_reply, speaker=speaker, model=tts_model)
            logger.info("TTS synthesized path=%s", tts_path)
            
            # Use StorageProvider to handle the file (Local or S3)
            with open(tts_path, "rb") as f:
                audio_bytes = f.read()
            audio_url = storage_provider.save_file(audio_bytes, tts_path.name)
            
        except Exception as e:
            logger.error("TTS failed: %s", e)
            raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

        db.add_message(session_id=session_id, sender="coach", text=coach_reply, audio_path=audio_url)

        return ProcessAudioResponse(
            session_id=session_id,
            user_transcript=user_text,
            coach_reply=coach_reply,
            coach_audio_url=audio_url,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in process_audio")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/send_text", response_model=ProcessAudioResponse)
async def send_text(payload: TextMessageRequest):
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
    
    try:
        history = build_chat_history(payload.session_id)
        history.append({"role": "user", "content": payload.text})
        
        coach_reply = await ollama_service.chat(history, model=payload.model)
        logger.info("LLM reply len=%s", len(coach_reply))
        
        tts_path = await tts_service.synthesize(coach_reply, speaker=payload.speaker, model=payload.tts_model)
        logger.info("TTS synthesized path=%s", tts_path)
        
        # Use StorageProvider
        with open(tts_path, "rb") as f:
            audio_bytes = f.read()
        audio_url = storage_provider.save_file(audio_bytes, tts_path.name)

        db.add_message(session_id=payload.session_id, sender="coach", text=coach_reply, audio_path=audio_url)

        return ProcessAudioResponse(
            session_id=payload.session_id,
            user_transcript=payload.text,
            coach_reply=coach_reply,
            coach_audio_url=audio_url,
        )
    except Exception as e:
        logger.exception("Error in send_text")
        raise HTTPException(status_code=500, detail=str(e))


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


@app.websocket("/api/ws/call/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await connection_manager.connect(websocket, session_id)
    try:
        if not db.session_exists(session_id):
            db.add_session(session_id, mode="call")
            
        while True:
            # Expecting bytes for audio or json for control/metadata
            # For simplicity, assuming the client sends raw audio bytes
            # Ideally client should send a JSON first with metadata, or we use a custom protocol.
            # But the requirement is "user speaks", so likely streaming audio chunks.
            # For this MVP, let's assume the client sends one blob per turn (Turn-based as in plan).
            
            data = await websocket.receive_bytes()
            # We assume it's audio data
            # Tricky part: how to know model params? 
            # We can default them or expect client to have set them in a previous message or query params.
            # Let's fallback to defaults for now or parse if text frame. 
            # Note: receive_bytes will fail if text is sent. 
            
            # Better approach: `receive()` and check type.
            # But for "call" feature, audio bytes is most efficient. 
            
            await connection_manager.process_audio_stream(session_id, data)
            
    except WebSocketDisconnect:
        connection_manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass
        connection_manager.disconnect(session_id)


