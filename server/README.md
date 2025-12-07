# Speech Coach FastAPI

Implements call mode (per-turn audio upload) and chat mode with transcripts logged to SQLite while orchestrating Whisper STT, Ollama LLM, and Coqui TTS.

## Requirements
- FastAPI / Uvicorn
- ollama-python (Ollama running locally) ([docs](https://github.com/ollama/ollama-python))
- openai-whisper ([repo](https://github.com/openai/whisper))
- coqui-tts ([docs](https://coqui-tts.readthedocs.io/en/latest/))

Dependencies are assumed installed per project setup.

## Run
```bash
uvicorn server.main:app --reload
```

Then open http://localhost:8000 to use the UI (Call and Chat modes).

## Notes
- LLM model choice comes from `llm_models_config.json`; the highest-tier primary recommendation is pulled automatically if missing.
- UI dropdowns let you pick the LLM (tag) and TTS speaker per turn; defaults come from configs.
- TTS uses `tts_model_info.json` to pick the XTTS voice; audio is written to `output/`.
- Transcripts and message logs are stored in `server/data/app.db`.
- Call mode: toggling “Start Call” begins continuous mic capture; silence-based VAD chunks are auto-sent. Mute stops sending without leaving the call. Tuning (in `server/static/app.js`): `vadThreshold` (RMS), `vadSilenceMs`, `minChunkMs`, `maxChunkMs`.

