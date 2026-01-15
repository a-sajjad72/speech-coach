"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MicOff, Mic, Phone, Volume2 } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"

interface CallModeOverlayProps {
  language: string
  topic: string
  isOpen: boolean
  onClose: () => void
  onCallEnd: () => void
}

export function CallModeOverlay({ language, topic, isOpen, onClose, onCallEnd }: CallModeOverlayProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [callDuration, setCallDuration] = useState(0)
  const [isAISpeaking, setIsAISpeaking] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    // Simulate AI speaking/listening pattern
    const speakInterval = setInterval(() => {
      setIsAISpeaking((prev) => !prev)
    }, 4000)

    return () => clearInterval(speakInterval)
  }, [isOpen])

  const handleEndCall = () => {
    onCallEnd()
    onClose()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

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
          <p className="text-sm text-purple-100">
            {isAISpeaking ? "Listen to the AI tutor's response" : "Speak clearly and naturally (up to 30 seconds)"}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 md:space-x-6 mb-12">
          {/* Mute Button */}
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-full w-16 h-16 md:w-20 md:h-20 transition-all ${
              isMuted
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
              style={{
                writing: "vertical-rl",
              }}
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
