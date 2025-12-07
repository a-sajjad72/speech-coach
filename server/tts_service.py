import logging
from pathlib import Path
from typing import Optional, Dict
from uuid import uuid4

from TTS.api import TTS  # type: ignore

from .config import OUTPUT_DIR, TTS_MODELS, TTS_DEFAULT_MODEL, DEFAULT_SPEAKER

logger = logging.getLogger("speech_coach.tts")


class TTSService:
    def __init__(self):
        self.models_cache: Dict[str, TTS] = {}
        self.output_dir = OUTPUT_DIR

    def _find_model_info(self, model_id: Optional[str]):
        target = model_id or TTS_DEFAULT_MODEL.get("model")
        for m in TTS_MODELS:
            if m.get("model") == target:
                return m
        return TTS_DEFAULT_MODEL

    def _ensure_tts(self, model_info: dict):
        model_id = model_info.get("model")
        if model_id in self.models_cache:
            return self.models_cache[model_id]
        full_name = model_info.get("full_model_name")
        logger.info("Loading TTS model_id=%s full_name=%s (downloads may occur)", model_id, full_name)
        tts = TTS(model_name=full_name, progress_bar=False)
        self.models_cache[model_id] = tts
        logger.info("TTS model loaded model_id=%s", model_id)
        return tts

    def synthesize(self, text: str, speaker: Optional[str] = None, model: Optional[str] = None) -> Path:
        model_info = self._find_model_info(model)
        tts = self._ensure_tts(model_info)
        file_path = self.output_dir / f"coach_tts_{uuid4().hex}.wav"

        available_speakers = model_info.get("available_speaker_ids")
        language = model_info.get("language")

        kwargs = {"text": text, "file_path": str(file_path)}

        if available_speakers:
            voice = speaker or DEFAULT_SPEAKER or available_speakers[0]
            kwargs["speaker"] = voice
        if language:
            kwargs["language"] = language

        logger.info(
            "Synthesizing TTS model=%s len=%s speaker=%s lang=%s -> %s",
            model_info.get("model"),
            len(text),
            kwargs.get("speaker"),
            kwargs.get("language"),
            file_path,
        )
        tts.tts_to_file(**kwargs)
        return file_path


