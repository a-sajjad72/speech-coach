"use client"

import { useState } from "react"
import { MainConversation } from "@/components/main-conversation"
import { ModelSettings } from "@/components/model-settings"
import { ConversationHistory } from "@/components/conversation-history"

export type AppView = "conversation" | "settings" | "history"

export default function SpeechCoach() {
  const [currentView, setCurrentView] = useState<AppView>("conversation")
  const [currentLanguage, setCurrentLanguage] = useState("Spanish")
  const [currentTopic, setCurrentTopic] = useState("Travel Planning")
  const [selectedModel, setSelectedModel] = useState("Llama-3-8B-Instruct (Q4_K_M)")
  const [sessionToResume, setSessionToResume] = useState<string | null>(null)

  const renderCurrentView = () => {
    switch (currentView) {
      case "conversation":
        return (
          <MainConversation
            language={currentLanguage}
            topic={currentTopic}
            model={selectedModel}
            onNavigate={setCurrentView}
            onLanguageChange={setCurrentLanguage}
            onTopicChange={setCurrentTopic}
            onModelChange={setSelectedModel}
            initialSessionId={sessionToResume}
          />
        )
      case "settings":
        return (
          <ModelSettings
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            onNavigate={setCurrentView}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />
        )
      case "history":
        return (
          <ConversationHistory
            onNavigate={setCurrentView}
            onResumeSession={(sessionId) => {
              console.log("Setting session to resume:", sessionId)
              setSessionToResume(sessionId)
              setCurrentView("conversation")
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">{renderCurrentView()}</div>
  )
}
