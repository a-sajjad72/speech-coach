// API Request/Response Types

export interface SessionCreateRequest {
    mode: "call" | "chat"
    topic?: string
    language?: string
    model?: string
}

export interface SessionCreateResponse {
    session_id: string
}

export interface TextMessageRequest {
    session_id: string
    text: string
    model?: string | null
    speaker?: string | null
    tts_model?: string | null
}

export interface ProcessAudioResponse {
    session_id: string
    user_transcript: string
    coach_reply: string
    coach_audio_url: string
}

export interface Message {
    id?: number
    session_id?: string
    sender: "user" | "coach"
    text: string
    audio_path?: string | null
    timestamp?: string
    created_at?: string
}

export interface ChatHistoryResponse {
    session_id: string
    messages: Message[]
}

// Session management types
export interface SessionInfo {
    session_id: string
    mode: "call" | "chat"
    created_at: string
    topic: string
    language: string
    model?: string | null
    message_count: number
    duration_seconds: number
    first_message?: string | null
    last_message?: string | null
}

export interface SessionsListResponse {
    sessions: SessionInfo[]
}

export interface TTSModel {
    id: string
    full_model_name: string
    language: string
    speakers: string[]
    default: boolean
}

export interface LLMModel {
    name: string
    tag: string
    role: string
    tier: string
    primary: boolean
}

export interface ModelsInfoResponse {
    default_model: string
    llm_models: LLMModel[]
    tts_models: TTSModel[]
    default_tts_model: string
    speakers: string[]
}

// WebSocket Message Types

export interface WebSocketTranscriptionMessage {
    type: "transcription"
    text: string
}

export interface WebSocketStatusMessage {
    type: "status"
    status: "thinking" | "speaking" | "idle"
}

export interface WebSocketTextResponseMessage {
    type: "text_response"
    text: string
}

export interface WebSocketAudioUrlMessage {
    type: "audio_url"
    url: string
}

export interface WebSocketErrorMessage {
    type: "error"
    message: string
}

export type WebSocketMessage =
    | WebSocketTranscriptionMessage
    | WebSocketStatusMessage
    | WebSocketTextResponseMessage
    | WebSocketAudioUrlMessage
    | WebSocketErrorMessage

// Audio Recording Types

export interface VADConfig {
    threshold: number
    silenceMs: number
    minChunkMs: number
    maxChunkMs: number
}

export interface AudioRecorderConfig {
    vadConfig?: Partial<VADConfig>
    onAudioChunk?: (blob: Blob) => void
    onError?: (error: Error) => void
}
