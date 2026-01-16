"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionMenu } from "@/components/session-menu"
import { Settings, History, Send, Sparkles, Volume2, Plus, Globe, BookOpen, Menu, Phone } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { FeedbackButtons } from "@/components/feedback-buttons"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { ChatInput } from "@/components/chat-input"
import { CallModeOverlay } from "@/components/call-mode-overlay"
import { apiClient } from "@/lib/api-client"

interface Message {
  id: string
  type: "user" | "ai"
  text: string
  timestamp: Date
  isPlaying?: boolean
  audioUrl?: string
}

interface MainConversationProps {
  language: string
  topic: string
  model: string
  onNavigate: (view: "conversation" | "settings" | "history") => void
  onLanguageChange: (language: string) => void
  onTopicChange: (topic: string) => void
  onModelChange: (model: string) => void
}

export function MainConversation({
  language,
  topic,
  model,
  onNavigate,
  onLanguageChange,
  onTopicChange,
  onModelChange,
}: MainConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customTopic, setCustomTopic] = useState("")
  const [showTopicInput, setShowTopicInput] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [showTopicSelect, setShowTopicSelect] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [isInCallMode, setIsInCallMode] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)

  const languages = [
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Japanese",
    "Korean",
    "Chinese",
    "Russian",
    "Arabic",
    "Hindi",
    "Dutch",
  ]

  const defaultTopics = [
    "Travel Planning",
    "Restaurant Dining",
    "Job Interview",
    "Shopping & Markets",
    "Medical Appointments",
    "Business Meetings",
    "Social Conversations",
    "Academic Discussions",
    "Daily Routines",
    "Hobbies & Interests",
  ]

  const availableModels = [
    "Llama-3-8B-Instruct (Q4_K_M)",
    "Mistral-7B-Instruct-v0.3",
    "CodeLlama-13B-Instruct",
    "Llama-3-70B-Instruct (Q4_K_M)",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await apiClient.createSession("chat")
        setSessionId(response.session_id)
        console.log("Session created:", response.session_id)
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    }
    initSession()
  }, [])

  const handleCallEnd = async () => {
    // Reload chat history after call ends
    if (sessionId) {
      try {
        const history = await apiClient.getChatHistory(sessionId)
        const formattedMessages: Message[] = history.messages.map((msg, idx) => ({
          id: String(idx),
          type: msg.sender === "user" ? "user" : "ai",
          text: msg.text,
          timestamp: new Date(msg.timestamp || Date.now()),
          audioUrl: msg.audio_path || undefined,
        }))
        setMessages(formattedMessages)
      } catch (error) {
        console.error("Failed to load chat history:", error)
      }
    }
  }

  const handleSendText = async (text: string) => {
    if (!sessionId) {
      console.error("No session ID")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)

    try {
      const response = await apiClient.sendTextMessage(sessionId, text, {
        model: null,
        speaker: null,
        ttsModel: null,
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: response.coach_reply,
        timestamp: new Date(),
        isPlaying: true,
        audioUrl: response.coach_audio_url,
      }
      setMessages((prev) => [...prev, aiMessage])

      // Play audio - ensure URL is correctly formatted
      const audioUrl = response.coach_audio_url.startsWith("http")
        ? response.coach_audio_url
        : `http://localhost:8000${response.coach_audio_url}`

      console.log("Playing audio from:", audioUrl)
      const audio = new Audio(audioUrl)

      audio.play().catch((error) => {
        console.error("Audio playback failed:", error)
        // Update playing state even if playback fails
        setMessages((prev) => prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, isPlaying: false } : msg)))
      })

      audio.onended = () => {
        setMessages((prev) => prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, isPlaying: false } : msg)))
      }
    } catch (error) {
      console.error("Failed to send text message:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartRecording = async () => {
    if (!sessionId) {
      console.error("No session ID")
      return
    }

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Create blob from chunks
        const audioBlob = new Blob(chunks, { type: "audio/webm" })

        // Send to server
        setIsRecording(false)
        setIsProcessing(true)

        try {
          const response = await apiClient.processAudio(sessionId, audioBlob, {
            model: null,
            speaker: null,
            ttsModel: null,
          })

          const userMessage: Message = {
            id: Date.now().toString(),
            type: "user",
            text: response.user_transcript,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, userMessage])

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            text: response.coach_reply,
            timestamp: new Date(),
            isPlaying: true,
            audioUrl: response.coach_audio_url,
          }
          setMessages((prev) => [...prev, aiMessage])

          // Play audio - ensure URL is correctly formatted
          const audioUrl = response.coach_audio_url.startsWith("http")
            ? response.coach_audio_url
            : `http://localhost:8000${response.coach_audio_url}`

          console.log("Playing audio from:", audioUrl)
          const audio = new Audio(audioUrl)

          audio.play().catch((error) => {
            console.error("Audio playback failed:", error)
            setMessages((prev) => prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, isPlaying: false } : msg)))
          })

          audio.onended = () => {
            setMessages((prev) => prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, isPlaying: false } : msg)))
          }
        } catch (error) {
          console.error("Failed to process audio:", error)
        } finally {
          setIsProcessing(false)
        }
      }

      // Store recorder reference
      audioRecorderRef.current = recorder as any

      // Start recording
      recorder.start()
      setIsRecording(true)

    } catch (error) {
      console.error("Failed to start recording:", error)
      alert("Failed to access microphone. Please grant permission and try again.")
    }
  }

  const handleStopRecording = () => {
    if (audioRecorderRef.current && audioRecorderRef.current.state === "recording") {
      audioRecorderRef.current.stop()
    }
  }

  const handleCancelRecording = () => {
    if (audioRecorderRef.current) {
      // Stop the recorder without processing
      const recorder = audioRecorderRef.current as MediaRecorder

      // Remove the onstop handler to prevent processing
      recorder.onstop = () => {
        // Just stop the stream tracks
        recorder.stream.getTracks().forEach(track => track.stop())
      }

      if (recorder.state === "recording") {
        recorder.stop()
      }

      audioRecorderRef.current = null
      setIsRecording(false)
    }
  }

  const handleTopicSubmit = () => {
    if (customTopic.trim()) {
      onTopicChange(customTopic)
      setShowTopicInput(false)
      setCustomTopic("")
      setShowTopicSelect(false)
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    onLanguageChange(newLanguage)
    setShowLanguageSelect(false)
    setMessages([
      {
        id: "1",
        type: "ai",
        text: `Hello! I'm your ${newLanguage} conversation coach. Let's practice talking about ${topic.toLowerCase()}. How can I help you today?`,
        timestamp: new Date(),
      },
    ])
  }

  const handleTopicChange = (newTopic: string) => {
    onTopicChange(newTopic)
    setShowTopicSelect(false)
    setMessages([
      {
        id: "1",
        type: "ai",
        text: `Great! Let's practice ${language} conversation about ${newTopic.toLowerCase()}. What would you like to discuss?`,
        timestamp: new Date(),
      },
    ])
  }

  const handleStartCall = () => {
    setIsInCallMode(true)
  }

  const handleClearConversation = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        text: `Hello! I'm your ${language} conversation coach. Let's practice talking about ${topic.toLowerCase()}. How can I help you today?`,
        timestamp: new Date(),
      },
    ])
  }

  const handleExportConversation = () => {
    const conversationText = messages.map((msg) => `${msg.type === "user" ? "You" : "Coach"}: ${msg.text}`).join("\n\n")

    const dataStr = JSON.stringify(
      {
        language,
        topic,
        model,
        exportDate: new Date().toISOString(),
        messages: messages,
        conversationText,
      },
      null,
      2,
    )

    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `speechcoach-${language}-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCopyConversation = () => {
    const conversationText = messages.map((msg) => `${msg.type === "user" ? "You" : "Coach"}: ${msg.text}`).join("\n\n")

    navigator.clipboard.writeText(conversationText).then(() => {
      alert("Conversation copied to clipboard!")
    })
  }

  const handleReportIssue = () => {
    alert(
      "Thank you for reporting an issue! Please describe the problem and we'll investigate it.\n\nSession Info:\nLanguage: " +
      language +
      "\nTopic: " +
      topic +
      "\nMessages: " +
      messages.length,
    )
  }

  const handleResetSession = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        text: `Hello! I'm your ${language} conversation coach. Let's practice talking about ${topic.toLowerCase()}. How can I help you today?`,
        timestamp: new Date(),
      },
    ])
    setIsProcessing(false)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        language={language}
        topic={topic}
        model={model}
        onNavigate={onNavigate}
        onLanguageChange={onLanguageChange}
        onTopicChange={onTopicChange}
        onModelChange={onModelChange}
        messagesCount={messages.length}
      />

      <div className="w-80 lg:w-80 md:w-72 hidden lg:flex bg-white/60 backdrop-blur-xl border-r border-purple-100 flex-col">
        <div className="p-6 border-b border-purple-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                SpeechCoach
              </h1>
              <p className="text-sm text-gray-500">AI Language Tutor</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Language</span>
              <div className="flex items-center space-x-2">
                <Badge
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 rounded-full cursor-pointer"
                  onClick={() => setShowLanguageSelect(!showLanguageSelect)}
                >
                  🌍 {language}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLanguageSelect(!showLanguageSelect)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-purple-600"
                >
                  <Globe className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {showLanguageSelect && (
              <div className="space-y-2">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Topic</span>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 cursor-pointer rounded-full"
                  onClick={() => setShowTopicSelect(!showTopicSelect)}
                >
                  📚 {topic}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTopicSelect(!showTopicSelect)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-orange-600"
                >
                  <BookOpen className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {showTopicSelect && (
              <div className="space-y-3">
                <Select value={topic} onValueChange={handleTopicChange}>
                  <SelectTrigger className="border-orange-200 focus:border-orange-400 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultTopics.map((topicOption) => (
                      <SelectItem key={topicOption} value={topicOption}>
                        {topicOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Or enter custom topic..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleTopicSubmit()}
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-xl text-sm"
                  />
                  <Button
                    onClick={handleTopicSubmit}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl px-3"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Model</span>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="border-gray-200 text-gray-600 rounded-full text-xs cursor-pointer hover:bg-gray-50"
                  onClick={() => setShowModelSelect(!showModelSelect)}
                >
                  🤖 {model.split(" ")[0]}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModelSelect(!showModelSelect)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {showModelSelect && (
              <div className="space-y-2">
                <Select value={model} onValueChange={onModelChange}>
                  <SelectTrigger className="border-gray-200 focus:border-gray-400 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((modelOption) => (
                      <SelectItem key={modelOption} value={modelOption}>
                        {modelOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Model</span>
              <Badge variant="outline" className="border-gray-200 text-gray-600 rounded-full text-xs">
                {model.split(" ")[0]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
            onClick={() => onNavigate("history")}
          >
            <History className="h-4 w-4 mr-3" />
            View History
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
            onClick={() => onNavigate("settings")}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl"
            onClick={() => setShowTopicSelect(!showTopicSelect)}
          >
            <Plus className="h-4 w-4 mr-3" />
            Change Topic
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl"
            onClick={handleStartCall}
          >
            <Phone className="h-4 w-4 mr-3" />
            Start Call Mode
          </Button>
        </div>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Session</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Messages</span>
                <span className="font-medium text-purple-600">{messages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Practice Session</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Practicing {language} • Topic: {topic}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleStartCall}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-full text-white"
                size="sm"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Call Mode
              </Button>
              <SessionMenu
                onClearConversation={handleClearConversation}
                onExportConversation={handleExportConversation}
                onCopyConversation={handleCopyConversation}
                onReportIssue={handleReportIssue}
                onResetSession={handleResetSession}
                messagesCount={messages.length}
              />
            </div>
          </div>

          {showTopicInput && (
            <div className="mt-4 flex space-x-3">
              <Input
                placeholder="Enter a custom topic..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTopicSubmit()}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
              />
              <Button
                onClick={handleTopicSubmit}
                className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[70%] ${message.type === "user" ? "ml-4 md:ml-20" : "mr-4 md:mr-20"}`}
                >
                  <Card
                    className={`p-3 md:p-5 shadow-lg border-0 rounded-2xl md:rounded-3xl ${message.type === "user"
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      : "bg-white text-gray-800 shadow-purple-100"
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <p className="leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-between mt-4">
                          <p className={`text-xs ${message.type === "user" ? "text-purple-100" : "text-gray-500"}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                          {message.type === "ai" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-3 rounded-full ${message.isPlaying ? "bg-orange-100 text-orange-600" : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                              <Volume2 className="h-3 w-3 mr-1" />
                              {message.isPlaying ? "Playing" : "Listen"}
                            </Button>
                          )}
                        </div>
                      </div>
                      {message.isPlaying && <AudioVisualizer isActive={true} size="sm" />}
                    </div>
                  </Card>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[70%] mr-20">
                  <Card className="bg-white p-5 shadow-lg border-0 rounded-3xl shadow-purple-100">
                    <div className="flex items-center space-x-3">
                      <div className="animate-pulse text-gray-600">Processing your speech...</div>
                      <AudioVisualizer isActive={true} size="sm" />
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border-t border-purple-100">
          {messages.length > 1 && (
            <div className="px-6 py-4 border-b border-purple-100">
              <div className="max-w-4xl mx-auto">
                <FeedbackButtons
                  onFeedbackRequest={(type) => {
                    console.log("Feedback requested:", type)
                  }}
                />
              </div>
            </div>
          )}

          <ChatInput
            onSendText={handleSendText}
            onStartVoiceRecording={handleStartRecording}
            onStopVoiceRecording={handleStopRecording}
            onCancelVoiceRecording={handleCancelRecording}
            isRecording={isRecording}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      <CallModeOverlay
        language={language}
        topic={topic}
        isOpen={isInCallMode}
        onClose={() => setIsInCallMode(false)}
        onCallEnd={handleCallEnd}
        sessionId={sessionId || undefined}
      />
    </div>
  )
}
