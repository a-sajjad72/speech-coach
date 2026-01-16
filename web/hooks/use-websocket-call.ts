import { useState, useRef, useCallback, useEffect } from "react"
import type { WebSocketMessage } from "@/lib/types"

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000"

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error"

interface UseWebSocketCallReturn {
    connectionState: ConnectionState
    connect: (sessionId: string) => Promise<void>
    disconnect: () => void
    sendAudio: (audioBlob: Blob) => void
    lastMessage: WebSocketMessage | null
    error: string | null
}

/**
 * React hook for managing WebSocket connections during call mode
 */
export function useWebSocketCall(): UseWebSocketCallReturn {
    const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
    const [error, setError] = useState<string | null>(null)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    /**
     * Connect to WebSocket
     */
    const connect = useCallback(async (sessionId: string) => {
        // Don't reconnect if already connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.warn("WebSocket: Already connected")
            return
        }

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        setConnectionState("connecting")
        setError(null)

        try {
            const url = `${WS_BASE_URL}/api/ws/call/${sessionId}`
            const ws = new WebSocket(url)

            ws.onopen = () => {
                console.log("WebSocket: Connected")
                setConnectionState("connected")
                setError(null)
            }

            ws.onclose = (event) => {
                console.log("WebSocket: Disconnected", event.code, event.reason)
                setConnectionState("disconnected")
                wsRef.current = null

                // Auto-reconnect on unexpected disconnect (optional)
                // Uncomment to enable auto-reconnect
                // if (event.code !== 1000) {
                //   reconnectTimeoutRef.current = setTimeout(() => {
                //     connect(sessionId)
                //   }, 3000)
                // }
            }

            ws.onerror = (event) => {
                console.error("WebSocket: Error", event)
                setConnectionState("error")
                setError("WebSocket connection error")
            }

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage
                    console.log("WebSocket: Message received", message)
                    setLastMessage(message)
                } catch (err) {
                    console.error("WebSocket: Failed to parse message", err)
                }
            }

            wsRef.current = ws
        } catch (err) {
            console.error("WebSocket: Failed to connect", err)
            setConnectionState("error")
            setError((err as Error).message)
        }
    }, [])

    /**
     * Disconnect from WebSocket
     */
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (wsRef.current) {
            wsRef.current.close(1000, "Client disconnected")
            wsRef.current = null
        }

        setConnectionState("disconnected")
        setLastMessage(null)
        setError(null)
    }, [])

    /**
     * Send audio blob through WebSocket
     */
    const sendAudio = useCallback((audioBlob: Blob) => {
        if (!wsRef.current) {
            console.warn("WebSocket: Not connected, cannot send audio")
            return
        }

        if (wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket: Connection not ready, cannot send audio")
            return
        }

        try {
            wsRef.current.send(audioBlob)
            console.log("WebSocket: Audio sent", audioBlob.size, "bytes")
        } catch (err) {
            console.error("WebSocket: Failed to send audio", err)
            setError((err as Error).message)
        }
    }, [])

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    return {
        connectionState,
        connect,
        disconnect,
        sendAudio,
        lastMessage,
        error,
    }
}
