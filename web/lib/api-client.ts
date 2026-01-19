import type {
    SessionCreateRequest,
    SessionCreateResponse,
    TextMessageRequest,
    ProcessAudioResponse,
    ChatHistoryResponse,
    ModelsInfoResponse,
    SessionsListResponse,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

class APIError extends Error {
    constructor(
        message: string,
        public status: number,
        public statusText: string,
    ) {
        super(message)
        this.name = "APIError"
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new APIError(
            `API request failed: ${response.statusText} - ${errorText} `,
            response.status,
            response.statusText,
        )
    }
    return response.json()
}

export const apiClient = {
    /**
     * Create a new session
     */
    async createSession(
        mode: "call" | "chat" = "chat",
        metadata?: { topic?: string; language?: string; model?: string }
    ): Promise<SessionCreateResponse> {
        const payload: SessionCreateRequest = { mode, ...metadata }
        const response = await fetch(`${API_BASE_URL}/api/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
        return handleResponse<SessionCreateResponse>(response)
    },

    async updateSessionMetadata(
        sessionId: string,
        metadata: { topic?: string; language?: string; model?: string }
    ): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/metadata`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(metadata),
        })
        if (!response.ok) {
            throw new Error(`Failed to update metadata: ${response.statusText}`)
        }
    },

    /**
     * Get models information (LLM and TTS)
     */
    async getModelsInfo(): Promise<ModelsInfoResponse> {
        const response = await fetch(`${API_BASE_URL}/api/models`)
        return handleResponse<ModelsInfoResponse>(response)
    },

    /**
     * Get chat history for a session
     */
    async getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
        const response = await fetch(`${API_BASE_URL}/api/chat/history?session_id=${sessionId} `)
        if (!response.ok) {
            throw new Error(`Failed to get chat history: ${response.statusText} `)
        }
        return response.json()
    },

    async getAllSessions(): Promise<SessionsListResponse> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/all`)
        if (!response.ok) {
            throw new Error(`Failed to get sessions: ${response.statusText} `)
        }
        return response.json()
    },

    async deleteSession(sessionId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
            method: "DELETE",
        })
        if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`)
        }
    },

    async clearAllSessions(): Promise<{ count: number }> {
        const response = await fetch(`${API_BASE_URL}/api/sessions/clear-all`, {
            method: "DELETE",
        })
        if (!response.ok) {
            throw new Error(`Failed to clear all sessions: ${response.statusText}`)
        }
        return response.json()
    },

    /**
     * Send a text message in chat mode
     */
    async sendTextMessage(
        sessionId: string,
        text: string,
        options: {
            model?: string | null
            speaker?: string | null
            ttsModel?: string | null
        } = {},
    ): Promise<ProcessAudioResponse> {
        const payload: TextMessageRequest = {
            session_id: sessionId,
            text,
            model: options.model,
            speaker: options.speaker,
            tts_model: options.ttsModel,
        }

        const response = await fetch(`${API_BASE_URL}/api/send_text`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
        return handleResponse<ProcessAudioResponse>(response)
    },

    /**
     * Process an audio file (non-WebSocket mode)
     */
    async processAudio(
        sessionId: string,
        audioBlob: Blob,
        options: {
            model?: string | null
            speaker?: string | null
            ttsModel?: string | null
            callMode?: boolean
        } = {},
    ): Promise<ProcessAudioResponse> {
        const formData = new FormData()
        formData.append("session_id", sessionId)
        formData.append("audio", audioBlob, "audio.webm")
        if (options.model) formData.append("model", options.model)
        if (options.ttsModel) formData.append("tts_model", options.ttsModel)
        if (options.speaker) formData.append("speaker", options.speaker)
        if (options.callMode) formData.append("call_mode", "true")

        const response = await fetch(`${API_BASE_URL}/api/process_audio`, {
            method: "POST",
            body: formData,
        })
        return handleResponse<ProcessAudioResponse>(response)
    },
}

export { APIError }
