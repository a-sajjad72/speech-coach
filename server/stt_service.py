import logging
import tempfile
from pathlib import Path
from typing import Optional

import whisper  # type: ignore

from .config import WHISPER_MODEL_SIZE

logger = logging.getLogger("speech_coach.stt")


class WhisperService:
    def __init__(self):
        self.model: Optional[any] = None

    def _ensure_model(self):
        if self.model is None:
            # Lazy load to avoid blocking app startup with downloads.
            logger.info("Loading Whisper model=%s (downloads may occur)", WHISPER_MODEL_SIZE)
            self.model = whisper.load_model(WHISPER_MODEL_SIZE)
            logger.info("Whisper model loaded")

    def transcribe_file(self, file_path: Path) -> str:
        self._ensure_model()
        logger.info("Transcribing file=%s", file_path)
        result = self.model.transcribe(str(file_path))
        logger.info("Transcription complete")
        return result.get("text", "").strip()

    def transcribe_upload(self, upload_file) -> str:
        """Accepts FastAPI UploadFile, saves to temp, transcribes."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(upload_file.file.read())
            tmp_path = Path(tmp.name)
        text = self.transcribe_file(tmp_path)
        tmp_path.unlink(missing_ok=True)
        return text


