import logging
import asyncio
from typing import Dict, List, Any
from fastapi import WebSocket, WebSocketDisconnect
from pathlib import Path

from .db import Database
from .stt_service import WhisperService
from .ollama_service import OllamaService
from .tts_service import TTSService
from .storage import StorageProvider

logger = logging.getLogger("speech_coach.websocket")

class ConnectionManager:
    def __init__(
        self,
        db: Database,
        stt_service: WhisperService,
        ollama_service: OllamaService,
        tts_service: TTSService,
        storage_provider: StorageProvider,
    ):
        self.active_connections: Dict[str, WebSocket] = {}
        self.db = db
        self.stt_service = stt_service
        self.ollama_service = ollama_service
        self.tts_service = tts_service
        self.storage_provider = storage_provider

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected: session_id={session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        logger.info(f"WebSocket disconnected: session_id={session_id}")

    def build_chat_history(self, session_id: str) -> List[Dict[str, str]]:
        messages = self.db.get_messages(session_id)
        chat_messages = []
        for msg in messages:
            role = "assistant" if msg["sender"] == "coach" else "user"
            content = msg["text"] or ""
            chat_messages.append({"role": role, "content": content})
        return chat_messages

    async def process_audio_stream(
        self, session_id: str, audio_bytes: bytes, model: str = None, speaker: str = None, tts_model: str = None
    ):
        websocket = self.active_connections.get(session_id)
        if not websocket:
            logger.warning(f"No active WebSocket for session {session_id}")
            return

        try:
            # 1. Transcribe
            logger.info("Starting transcription...")
            # Ideally STT service would accept bytes directly, but our current implementation expects file/uploadfile
            # We will use transcribe_upload logic but adapted for bytes
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = Path(tmp.name)
            
            try:
                user_text = await self.stt_service.transcribe_file(tmp_path)
            finally:
                tmp_path.unlink(missing_ok=True)

            logger.info(f"Transcribed: {user_text}")
            await websocket.send_json({"type": "transcription", "text": user_text})
            
            self.db.add_message(session_id=session_id, sender="user", text=user_text)

            # 2. LLM
            history = self.build_chat_history(session_id)
            history.append({"role": "user", "content": user_text})  # Add current msg
            
            # Send "thinking" status
            await websocket.send_json({"type": "status", "status": "thinking"})
            
            coach_reply = await self.ollama_service.chat(history, model=model)
            logger.info(f"Coach Reply: {coach_reply}")
            await websocket.send_json({"type": "text_response", "text": coach_reply})

            # 3. TTS
            await websocket.send_json({"type": "status", "status": "speaking"})
            
            # Use storage provider indirectly via tts_service or manually?
            # Existing tts_service uses direct file writes. We should update TTSService to use StorageProvider 
            # Or temporarily, we let TTSService write to disk, then we upload to StorageProvider?
            # Implementation plan said "Refactor process_audio to use StorageService".
            # Let's assume for now TTSService returns a Path (local), we then use StorageProvider to 'save' it (upload it) if needed.
            # But wait, TTSService currently writes to OUTPUT_DIR. 
            # Ideally TTSService should be injected with StorageProvider.
            
            # For this step, I'll pass the local content to storage provider if I had updated TTSService to take it.
            # Since I haven't updated TTSService signature yet, I will get the Path from TTSService, read it, and put it in StorageProvider, then return URL.
            
            tts_path = await self.tts_service.synthesize(coach_reply, speaker=speaker, model=tts_model)
            
            # Read back generated file to save via provider (if we were fully abstracting)
            # But currently TTSService writes to `config.OUTPUT_DIR` which is what LocalStorageProvider uses.
            # So if we are Local, it's already there. 
            # If we are S3, we need to upload it.
            
            with open(tts_path, "rb") as f:
                audio_data = f.read()
            
            filename = tts_path.name
            audio_url = self.storage_provider.save_file(audio_data, filename)
            
            # If S3, we can delete the local temp file generated by TTS service
            # but TTSService currently manages its output. 
            # We will rely on TTSService internal logic for now, but really we should refactor TTS service later to be cleaner.
             
            self.db.add_message(session_id=session_id, sender="coach", text=coach_reply, audio_path=audio_url)

            # Send audio URL to client (or bytes directly if preferred)
            await websocket.send_json({"type": "audio_url", "url": audio_url})
            
            # Also send end status
            await websocket.send_json({"type": "status", "status": "idle"})

        except Exception as e:
            logger.exception("Error in process_audio_stream")
            await websocket.send_json({"type": "error", "message": str(e)})

