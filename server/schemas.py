from typing import List, Optional
from pydantic import BaseModel


class SessionCreateRequest(BaseModel):
    mode: str


class SessionCreateResponse(BaseModel):
    session_id: str


class ProcessAudioResponse(BaseModel):
    session_id: str
    user_transcript: str
    coach_reply: str
    coach_audio_url: str


class TextMessageRequest(BaseModel):
    session_id: str
    text: str
    model: Optional[str] = None
    speaker: Optional[str] = None
    tts_model: Optional[str] = None


class Message(BaseModel):
    sender: str
    text: Optional[str]
    audio_path: Optional[str]
    created_at: str


class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[Message]


