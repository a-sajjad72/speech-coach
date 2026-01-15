"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Mic } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"

interface ChatInputProps {
  onSendText: (text: string) => void
  onStartVoiceRecording: () => void
  isRecording: boolean
  isProcessing: boolean
}

export function ChatInput({ onSendText, onStartVoiceRecording, isRecording, isProcessing }: ChatInputProps) {
  const [textInput, setTextInput] = useState("")

  const handleSendText = () => {
    if (textInput.trim()) {
      onSendText(textInput)
      setTextInput("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Recording Status */}
        {isRecording && (
          <div className="mb-4 flex items-center space-x-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600">Recording in progress...</span>
            <AudioVisualizer isActive={true} size="sm" />
          </div>
        )}

        {/* Text Input Area */}
        <div className="flex items-end space-x-2 md:space-x-3">
          <div className="flex-1 flex items-end space-x-2">
            <Input
              placeholder="Type your message or use voice..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isRecording || isProcessing}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl resize-none"
            />
          </div>

          {/* Send Text Button */}
          <Button
            onClick={handleSendText}
            disabled={!textInput.trim() || isRecording || isProcessing}
            className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 rounded-xl px-3 md:px-4 h-10 md:h-11"
            size="lg"
          >
            <Send className="h-4 w-4" />
          </Button>

          {/* Voice Record Button */}
          <Button
            onClick={onStartVoiceRecording}
            disabled={isProcessing}
            className={`rounded-full px-3 md:px-4 h-10 md:h-11 transition-all duration-300 ${
              isRecording
                ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse"
                : "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            }`}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">
          {isProcessing ? "Processing..." : "Press Enter to send or use the voice button"}
        </p>
      </div>
    </div>
  )
}
