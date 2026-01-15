"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, Trash2, Calendar, Clock, Globe, Search, Filter, MoreHorizontal } from "lucide-react"

interface ConversationSession {
  id: string
  date: Date
  language: string
  topic: string
  duration: string
  messageCount: number
  messages: Array<{
    type: "user" | "ai"
    text: string
    timestamp: Date
  }>
}

interface ConversationHistoryProps {
  onNavigate: (view: "conversation" | "settings" | "history") => void
}

export function ConversationHistory({ onNavigate }: ConversationHistoryProps) {
  const [sessions] = useState<ConversationSession[]>([
    {
      id: "1",
      date: new Date("2024-01-15T14:30:00"),
      language: "Spanish",
      topic: "Travel Planning",
      duration: "12 min",
      messageCount: 18,
      messages: [
        {
          type: "ai",
          text: "¡Hola! I'm your Spanish conversation coach. Let's practice talking about travel planning.",
          timestamp: new Date("2024-01-15T14:30:00"),
        },
        {
          type: "user",
          text: "Me gustaría visitar Barcelona el próximo verano.",
          timestamp: new Date("2024-01-15T14:30:30"),
        },
        {
          type: "ai",
          text: "¡Excelente elección! Barcelona es una ciudad maravillosa. ¿Qué lugares te interesan más?",
          timestamp: new Date("2024-01-15T14:30:45"),
        },
      ],
    },
    {
      id: "2",
      date: new Date("2024-01-14T16:15:00"),
      language: "French",
      topic: "Restaurant Ordering",
      duration: "8 min",
      messageCount: 12,
      messages: [
        {
          type: "ai",
          text: "Bonjour! Today we'll practice ordering at a French restaurant.",
          timestamp: new Date("2024-01-14T16:15:00"),
        },
        {
          type: "user",
          text: "Bonjour, je voudrais une table pour deux personnes, s'il vous plaît.",
          timestamp: new Date("2024-01-14T16:15:20"),
        },
      ],
    },
    {
      id: "3",
      date: new Date("2024-01-13T10:45:00"),
      language: "Spanish",
      topic: "Job Interview",
      duration: "15 min",
      messageCount: 24,
      messages: [
        {
          type: "ai",
          text: "Vamos a practicar una entrevista de trabajo en español.",
          timestamp: new Date("2024-01-13T10:45:00"),
        },
      ],
    },
  ])

  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const handleExportSession = (session: ConversationSession) => {
    const exportData = {
      session: {
        date: session.date.toISOString(),
        language: session.language,
        topic: session.topic,
        duration: session.duration,
      },
      messages: session.messages,
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

  const handleDeleteSession = (sessionId: string) => {
    console.log("Delete session:", sessionId)
  }

  const filteredSessions = sessions.filter(
    (session) =>
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.language.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full w-8 h-8 lg:w-10 lg:h-10"
              >
                <Filter className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
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
        <div className="flex-1 overflow-hidden">
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
                      <h2 className="text-lg lg:text-xl font-bold text-gray-800">{selectedSession.topic}</h2>
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
                          {selectedSession.language}
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
                <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                  {selectedSession.messages.map((message, index) => (
                    <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] lg:max-w-[70%] ${message.type === "user" ? "ml-4 lg:ml-20" : "mr-4 lg:mr-20"}`}
                      >
                        <Card
                          className={`p-3 lg:p-5 shadow-lg border-0 rounded-2xl lg:rounded-3xl ${
                            message.type === "user"
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                              : "bg-white/80 backdrop-blur-sm text-gray-800"
                          }`}
                        >
                          <p className="leading-relaxed text-sm lg:text-base mb-2 lg:mb-3">{message.text}</p>
                          <p
                            className={`text-xs ${
                              message.type === "user" ? "text-purple-100" : "text-gray-500"
                            } font-medium`}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Sessions Overview */
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="max-w-7xl mx-auto">
                {viewMode === "grid" ? (
                  /* Grid View */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                    {filteredSessions.map((session) => (
                      <Card
                        key={session.id}
                        className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 rounded-2xl bg-white/60 backdrop-blur-sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-4 lg:p-6">
                          <div className="space-y-3 lg:space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 rounded-full text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {session.language}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            </div>

                            <div>
                              <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base line-clamp-2">
                                {session.topic}
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
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-4 lg:p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800 text-sm lg:text-base truncate">
                                  {session.topic}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500 mt-1">
                                  <span>{session.date.toLocaleDateString()}</span>
                                  <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 rounded-full text-xs">
                                    {session.language}
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-gray-600 h-6 w-6 lg:h-8 lg:w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-purple-200 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 lg:h-10 lg:w-10 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-base lg:text-lg font-medium text-gray-700 mb-2">No Conversations Found</h3>
                      <p className="text-sm lg:text-base text-gray-500">Try adjusting your search terms</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
