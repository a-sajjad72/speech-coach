import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Paths
LLM_CONFIG_PATH = BASE_DIR / "llm_models_config.json"
TTS_CONFIG_PATH = BASE_DIR / "tts_model_info.json"
OUTPUT_DIR = BASE_DIR / "output"
DB_PATH = BASE_DIR / "server" / "data" / "app.db"

OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
DB_PATH.parent.mkdir(exist_ok=True, parents=True)

# Storage Configuration
STORAGE_CONFIG = {
    "STORAGE_TYPE": os.getenv("STORAGE_TYPE", "local"),  # local or s3
    "S3_BUCKET_NAME": os.getenv("S3_BUCKET_NAME"),
    "S3_REGION": os.getenv("S3_REGION"),
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID"),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY"),
}


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


LLM_CONFIG = load_json(LLM_CONFIG_PATH)
TTS_CONFIG_RAW = load_json(TTS_CONFIG_PATH)

# Normalize TTS config to a list of models
if isinstance(TTS_CONFIG_RAW, dict):
    TTS_MODELS = [TTS_CONFIG_RAW]
else:
    TTS_MODELS = list(TTS_CONFIG_RAW)


def _select_default_tts_model():
    # Prefer explicit default flag
    for m in TTS_MODELS:
        if m.get("default"):
            return m
    # Prefer vits if present
    for m in TTS_MODELS:
        if m.get("model") == "vits":
            return m
    # Fallback to first
    return TTS_MODELS[0]


TTS_DEFAULT_MODEL = _select_default_tts_model()

# Default whisper model size; can be overridden via env in the future.
WHISPER_MODEL_SIZE = "tiny"

# Audio settings derived from default TTS model
TTS_MODEL_NAME = TTS_DEFAULT_MODEL.get("full_model_name", "tts_models/multilingual/multi-dataset/xtts_v2")
DEFAULT_SPEAKER = None
if TTS_DEFAULT_MODEL.get("available_speaker_ids"):
    DEFAULT_SPEAKER = TTS_DEFAULT_MODEL["available_speaker_ids"][0]


