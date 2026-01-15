"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Settings, History, Send, Sparkles, Plus, Globe, BookOpen, X } from "lucide-react"
import { useState } from "react"

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  language: string
  topic: string
  model: string
  onNavigate: (view: "conversation" | "settings" | "history") => void
  onLanguageChange: (language: string) => void
  onTopicChange: (topic: string) => void
  onModelChange: (model: string) => void
  messagesCount: number
}

export function MobileSidebar({
  isOpen,
  onClose,
  language,
  topic,
  model,
  onNavigate,
  onLanguageChange,
  onTopicChange,
  onModelChange,
  messagesCount,
}: MobileSidebarProps) {
  const [customTopic, setCustomTopic] = useState("")
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const [showTopicSelect, setShowTopicSelect] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)

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

  const handleTopicSubmit = () => {
    if (customTopic.trim()) {
      onTopicChange(customTopic)
      setCustomTopic("")
      setShowTopicSelect(false)
      onClose()
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    onLanguageChange(newLanguage)
    setShowLanguageSelect(false)
  }

  const handleTopicChange = (newTopic: string) => {
    onTopicChange(newTopic)
    setShowTopicSelect(false)
    onClose()
  }

  const handleModelChange = (newModel: string) => {
    onModelChange(newModel)
    setShowModelSelect(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-white/95 backdrop-blur-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                    SpeechCoach
                  </SheetTitle>
                  <p className="text-xs text-gray-500">AI Language Tutor</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Current Session Info */}
          <div className="p-6 space-y-4 border-b border-purple-100">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Language</span>
                <div className="flex items-center space-x-2">
                  <Badge
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 rounded-full cursor-pointer text-xs"
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
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Topic</span>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 cursor-pointer rounded-full text-xs"
                    onClick={() => setShowTopicSelect(!showTopicSelect)}
                  >
                    📚 {topic.length > 15 ? topic.substring(0, 15) + "..." : topic}
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
                <Select value={model} onValueChange={handleModelChange}>
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
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 space-y-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
              onClick={() => {
                onNavigate("history")
                onClose()
              }}
            >
              <History className="h-4 w-4 mr-3" />
              View History
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
              onClick={() => {
                onNavigate("settings")
                onClose()
              }}
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
          </div>

          {/* Session Info */}
          <div className="p-6">
            <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Session</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-medium text-purple-600">{messagesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
