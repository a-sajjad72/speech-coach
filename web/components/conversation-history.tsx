"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, Trash2, Calendar, Clock, Globe, Search, Filter, MoreHorizontal, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { SessionInfo, Message } from "@/lib/types"
import { CardSessionMenu } from "./card-session-menu"
import { FilterMenu } from "./filter-menu"

interface ConversationSession {
  id: string
  date: Date
  mode: string
  duration: string
  messageCount: number
  topic: string
  language: string
  model?: string | null
  messages?: Array<{
    type: "user" | "ai"
    text: string
    timestamp: Date
    audio_path?: string
  }>
}

interface ConversationHistoryProps {
  onNavigate: (view: "conversation" | "settings" | "history") => void
  onResumeSession?: (sessionId: string) => void
}

export function ConversationHistory({ onNavigate, onResumeSession }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const availableLanguages = Array.from(new Set(sessions.map((s) => s.language)))

  // Format duration from seconds to readable string
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0 sec"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs} sec`
    if (secs === 0) return `${mins} min`
    return `${mins} min`
  }

  // Transform backend SessionInfo to component ConversationSession
  const transformSession = (session: SessionInfo): ConversationSession => {
    return {
      id: session.session_id,
      date: new Date(session.created_at),
      mode: session.mode,
      duration: formatDuration(session.duration_seconds),
      messageCount: session.message_count,
      topic: session.topic || "",
      language: session.language || "",
      model: session.model,
    }
  }

  // Fetch all sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.getAllSessions()
        const transformedSessions = response.sessions.map(transformSession)
        setSessions(transformedSessions)
      } catch (err) {
        console.error("Failed to fetch sessions:", err)
        setError("Failed to load conversation history")
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  // Load messages when session is selected
  const handleSessionClick = async (session: ConversationSession) => {
    if (session.messages) {
      // Messages already loaded
      setSelectedSession(session)
      return
    }

    setLoadingMessages(true)
    try {
      const history = await apiClient.getChatHistory(session.id)
      const messages = history.messages.map((msg: Message) => ({
        type: msg.sender === "user" ? "user" as const : "ai" as const,
        text: msg.text || "",
        timestamp: new Date(msg.timestamp || new Date().toISOString()),
        audio_path: msg.audio_path || undefined,
      }))

      const sessionWithMessages = { ...session, messages }
      setSessions(prev => prev.map(s => s.id === session.id ? sessionWithMessages : s))
      setSelectedSession(sessionWithMessages)
    } catch (err) {
      console.error("Failed to load messages:", err)
      setError("Failed to load session messages")
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleExportSession = (session: ConversationSession) => {
    const exportData = {
      session: {
        date: session.date.toISOString(),
        mode: session.mode,
        duration: session.duration,
      },
      messages: session.messages || [],
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversation-${session.date.toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      return
    }

    try {
      await apiClient.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
      }
    } catch (err) {
      console.error("Failed to delete session:", err)
      alert("Failed to delete session. Please try again.")
    }
  }

  const handleClearAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${sessions.length} conversation(s)? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await apiClient.clearAllSessions()
      setSessions([])
      setSelectedSession(null)
      alert(`Successfully deleted ${result.count} session(s)`)
    } catch (err) {
      console.error("Failed to clear all sessions:", err)
      alert("Failed to clear sessions. Please try again.")
    }
  }

  const handleLanguageFilter = (language: string) => {
    setSelectedLanguages((prev) => (prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]))
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.language.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguageFilter = selectedLanguages.length === 0 || selectedLanguages.includes(session.language)

    return matchesSearch && matchesLanguageFilter
  })

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* Top Navigation Bar */}
      <div className="flex flex-col w-full">
        <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm">
          <div className="flex items-center justify-between p-4 lg:p-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("conversation")}
                className="mr-2 lg:mr-4 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full w-10 h-10 lg:w-12 lg:h-12"
              >
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Conversation History
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-500">Review your practice sessions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-2 lg:px-4 py-1 lg:py-2 rounded-full text-xs lg:text-sm">
                {sessions.length} Sessions
              </Badge>
              {sessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs lg:text-sm"
                >
                  Clear All
                </Button>
              )}
              <FilterMenu
                selectedLanguages={selectedLanguages}
                onLanguageChange={handleLanguageFilter}
                availableLanguages={availableLanguages}
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-4 lg:px-6 pb-4 lg:pb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl bg-white/60"
                />
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-lg flex-shrink-0"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-lg flex-shrink-0"
                >
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedSession ? (
            /* Detailed Session View */
            <div className="flex flex-col h-full">
              {/* Session Header */}
              <div className="bg-white/60 backdrop-blur-sm border-b border-purple-100 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSession(null)}
                      className="text-gray-600 hover:text-purple-600 rounded-lg"
                    >
                      ← Back to History
                    </Button>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-gray-800">Practice Session</h2>
                      <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600 mt-1">
                        <span className="flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          <Calendar className="h-3 w-3 mr-1" />
                          {selectedSession.date.toLocaleDateString()}
                        </span>
                        <span className="flex items-center bg-green-100 text-green-600 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedSession.duration}
                        </span>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-full">
                          <Globe className="h-3 w-3 mr-1" />
                          {selectedSession.mode === "call" ? "Call Mode" : "Chat Mode"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleExportSession(selectedSession)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-sm"
                    >
                      <Download className="h-4 w-4 mr-1 lg:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl text-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1 lg:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <span className="ml-3 text-gray-600">Loading messages...</span>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                    {selectedSession.messages?.map((message, index) => (
                      <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] lg:max-w-[70%] ${message.type === "user" ? "ml-4 lg:ml-20" : "mr-4 lg:mr-20"}`}
                        >
                          <Card
                            className={`p-3 lg:p-5 shadow-lg border-0 rounded-2xl lg:rounded-3xl ${message.type === "user"
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                              : "bg-white/80 backdrop-blur-sm text-gray-800"
                              }`}
                          >
                            <p className="leading-relaxed text-sm lg:text-base mb-2 lg:mb-3">{message.text}</p>
                            <p
                              className={`text-xs ${message.type === "user" ? "text-purple-100" : "text-gray-500"
                                } font-medium`}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Sessions Overview */
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  <span className="ml-3 text-gray-600">Loading sessions...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">{error}</div>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto">
                  {viewMode === "grid" ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                      {filteredSessions.map((session) => (
                        <Card
                          key={session.id}
                          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 rounded-2xl bg-white/60 backdrop-blur-sm"
                          onClick={() => handleSessionClick(session)}
                        >
                          <CardContent className="p-4 lg:p-6">
                            <div className="space-y-3 lg:space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 rounded-full text-xs">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {session.mode === "call" ? "Call" : "Chat"}
                                </Badge>
                                <CardSessionMenu
                                  onExport={() => handleExportSession(session)}
                                  onDelete={() => handleDeleteSession(session.id)}
                                />
                              </div>

                              <div>
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base line-clamp-2">
                                  {session.topic || "Practice Session"}
                                </h3>
                                <p className="text-xs lg:text-sm text-gray-500">{session.date.toLocaleDateString()}</p>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {session.duration}
                                </span>
                                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                  {session.messageCount} msgs
                                </span>
                              </div>

                              {onResumeSession && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onResumeSession(session.id)
                                    onNavigate("conversation")
                                  }}
                                  className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                >
                                  Resume Chat
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-3 lg:space-y-4">
                      {filteredSessions.map((session) => (
                        <Card
                          key={session.id}
                          className="cursor-pointer transition-all duration-300 hover:shadow-lg border-0 rounded-2xl bg-white/60 backdrop-blur-sm"
                          onClick={() => handleSessionClick(session)}
                        >
                          <CardContent className="p-4 lg:p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">
                                    Practice Session
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500 mt-1">
                                    <span>{session.date.toLocaleDateString()}</span>
                                    <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 rounded-full text-xs">
                                      {session.mode === "call" ? "Call" : "Chat"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 lg:space-x-6 text-xs lg:text-sm text-gray-600 flex-shrink-0">
                                <span className="hidden sm:flex items-center">
                                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                                  {session.duration}
                                </span>
                                <span className="hidden md:inline">{session.messageCount} messages</span>
                                {onResumeSession && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onResumeSession(session.id)
                                      onNavigate("conversation")
                                    }}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs"
                                  >
                                    Resume
                                  </Button>
                                )}
                                <CardSessionMenu
                                  onExport={() => handleExportSession(session)}
                                  onDelete={() => handleDeleteSession(session.id)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {filteredSessions.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-200 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 lg:h-10 lg:w-10 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-base lg:text-lg font-medium text-gray-700 mb-2">No Conversations Found</h3>
                        <p className="text-sm lg:text-base text-gray-500">{searchQuery ? "Try adjusting your search terms" : "Start a conversation to see it here"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
