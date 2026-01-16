"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MicOff, Mic, Phone, Volume2 } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { useWebSocketCall } from "@/hooks/use-websocket-call"
import { AudioRecorder, AudioPlaybackQueue } from "@/lib/audio-utils"
import { apiClient } from "@/lib/api-client"

interface CallModeOverlayProps {
  language: string
  topic: string
  isOpen: boolean
  onClose: () => void
  onCallEnd: () => void
  sessionId?: string
}

export function CallModeOverlay({ language, topic, isOpen, onClose, onCallEnd, sessionId }: CallModeOverlayProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [callDuration, setCallDuration] = useState(0)
  const [aiStatus, setAiStatus] = useState<"idle" | "thinking" | "speaking">("idle")
  const [currentTranscription, setCurrentTranscription] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [statusMessage, setStatusMessage] = useState("Starting call...")

  const { connectionState, connect, disconnect, sendAudio, lastMessage, error } = useWebSocketCall()
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const playbackQueueRef = useRef<AudioPlaybackQueue | null>(null)

  // Initialize playback queue
  useEffect(() => {
    playbackQueueRef.current = new AudioPlaybackQueue()
    return () => {
      playbackQueueRef.current?.stop()
    }
  }, [])

  // Call duration timer
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Initialize call when opened
  useEffect(() => {
    if (!isOpen) return

    const initializeCall = async () => {
      try {
        setStatusMessage("Connecting to coach...")

        // Connect WebSocket
        if (sessionId) {
          await connect(sessionId)
        } else {
          console.error("No session ID provided")
          setStatusMessage("Error: No session ID")
          return
        }

        // Initialize audio recorder
        audioRecorderRef.current = new AudioRecorder({
          onAudioChunk: (blob) => {
            sendAudio(blob)
            setStatusMessage("Processing your speech...")
          },
          onError: (err) => {
            console.error("Audio recording error:", err)
            setStatusMessage("Microphone error")
          },
        })

        await audioRecorderRef.current.start()
        setStatusMessage("Ready! You can start speaking")
        setAiStatus("idle")
      } catch (err) {
        console.error("Failed to initialize call:", err)
        setStatusMessage("Failed to start call")
      }
    }

    initializeCall()

    return () => {
      // Cleanup on close
      audioRecorderRef.current?.stop()
      audioRecorderRef.current = null
      disconnect()
      setCallDuration(0)
      setCurrentTranscription("")
      setAiResponse("")
      setAiStatus("idle")
    }
  }, [isOpen, sessionId, connect, disconnect, sendAudio])

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    switch (lastMessage.type) {
      case "transcription":
        setCurrentTranscription(lastMessage.text)
        setStatusMessage("You said: " + lastMessage.text.substring(0, 50))
        break

      case "status":
        setAiStatus(lastMessage.status)
        if (lastMessage.status === "thinking") {
          setStatusMessage("AI is thinking...")
        } else if (lastMessage.status === "speaking") {
          setStatusMessage("AI is speaking...")
        } else {
          setStatusMessage("Your turn to speak")
        }
        break

      case "text_response":
        setAiResponse(lastMessage.text)
        break

      case "audio_url":
        playbackQueueRef.current?.enqueue(lastMessage.url)
        break

      case "error":
        console.error("WebSocket error:", lastMessage.message)
        setStatusMessage("Error: " + lastMessage.message)
        break
    }
  }, [lastMessage])

  // Handle mute toggle
  useEffect(() => {
    audioRecorderRef.current?.setMuted(isMuted)
  }, [isMuted])

  const handleEndCall = () => {
    audioRecorderRef.current?.stop()
    disconnect()
    onCallEnd()
    onClose()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isAISpeaking = aiStatus === "speaking"

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-orange-600 flex flex-col items-center justify-center z-50">
      {/* Header Info */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Practice Call</h3>
          <p className="text-sm text-purple-100">
            {language} • {topic}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-white">{formatDuration(callDuration)}</p>
          <p className="text-xs text-purple-100">Duration</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* AI Avatar / Status */}
        <div className="mb-8 text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center">
                <Volume2 className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* AI Speaking Status */}
          <p className="text-lg font-semibold text-white mb-4">
            {isAISpeaking ? "AI is speaking..." : "Your turn to speak"}
          </p>

          {/* Audio Visualizer */}
          <div className="flex justify-center mb-6">
            <AudioVisualizer isActive={isAISpeaking} size="lg" />
          </div>

          {/* Status Message */}
          <p className="text-sm text-purple-100 mb-2">{statusMessage}</p>
          {currentTranscription && (
            <p className="text-xs text-white/80 italic">"{currentTranscription}"</p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 md:space-x-6 mb-12">
          {/* Mute Button */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-full w-16 h-16 md:w-20 md:h-20 transition-all ${isMuted
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              }`}
          >
            {isMuted ? <MicOff className="w-8 h-8 md:w-10 md:h-10" /> : <Mic className="w-8 h-8 md:w-10 md:h-10" />}
          </Button>

          {/* End Call Button */}
          <Button
            onClick={handleEndCall}
            className="rounded-full w-20 h-20 md:w-24 md:h-24 bg-red-500 hover:bg-red-600 text-white shadow-2xl transition-transform hover:scale-105"
          >
            <Phone className="w-10 h-10 md:w-12 md:h-12 rotate-135" />
          </Button>

          {/* Volume Control Button */}
          <div className="flex flex-col items-center space-y-2">
            <Button
              onClick={() => setVolume(Math.min(100, volume + 10))}
              className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/30 text-white border border-white/30 p-0"
              size="icon"
            >
              <Volume2 className="w-5 h-5" />
            </Button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 md:w-24 h-1 bg-white/20 rounded-full accent-orange-400"
            />
            <span className="text-xs text-white font-semibold">{volume}%</span>
          </div>
        </div>

        {/* Tips */}
        <div className="absolute bottom-6 left-6 right-6 max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <h4 className="text-sm font-semibold text-white mb-2">Call Tips</h4>
            <ul className="text-xs text-purple-100 space-y-1">
              <li>• Speak naturally and at a comfortable pace</li>
              <li>• The AI will provide feedback after each exchange</li>
              <li>• Use the mute button if you need a moment</li>
              <li>• Click the red button to exit and save the conversation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
