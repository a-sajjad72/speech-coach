"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  ArrowLeft,
  Download,
  Trash2,
  CheckCircle,
  Cpu,
  HardDrive,
  Brain,
  Volume2,
  Search,
  Globe,
  Mic,
  Sparkles,
  Monitor,
  Wifi,
  Zap,
  Shield,
  Clock,
  Database,
  Activity,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface Model {
  id: string
  name: string
  family: string
  ramRequired: string
  description: string
  isDownloaded: boolean
  isRecommended: boolean
  downloadProgress?: number
}

interface ModelSettingsProps {
  selectedModel: string
  onModelSelect: (model: string) => void
  onNavigate: (view: "conversation" | "settings" | "history") => void
  currentLanguage: string
  onLanguageChange: (language: string) => void
}

export function ModelSettings({
  selectedModel,
  onModelSelect,
  onNavigate,
  currentLanguage,
  onLanguageChange,
}: ModelSettingsProps) {
  const [models] = useState<Model[]>([
    {
      id: "1",
      name: "Llama-3-8B-Instruct (Q4_K_M)",
      family: "Llama",
      ramRequired: "~5.0 GB",
      description: "Excellent conversational ability, strong reasoning.",
      isDownloaded: true,
      isRecommended: true,
    },
    {
      id: "2",
      name: "Mistral-7B-Instruct-v0.3",
      family: "Mistral",
      ramRequired: "~4.2 GB",
      description: "Fast and efficient, good for quick conversations.",
      isDownloaded: true,
      isRecommended: true,
    },
    {
      id: "3",
      name: "CodeLlama-13B-Instruct",
      family: "CodeLlama",
      ramRequired: "~8.5 GB",
      description: "Specialized for technical conversations and explanations.",
      isDownloaded: false,
      isRecommended: false,
    },
    {
      id: "4",
      name: "Llama-3-70B-Instruct (Q4_K_M)",
      family: "Llama",
      ramRequired: "~40.0 GB",
      description: "Most capable model, requires significant RAM.",
      isDownloaded: false,
      isRecommended: false,
      downloadProgress: 45,
    },
  ])

  const [activeTab, setActiveTab] = useState("models")
  const [microphoneDevice, setMicrophoneDevice] = useState("default")
  const [speakerDevice, setSpeakerDevice] = useState("default")
  const [inputVolume, setInputVolume] = useState([75])
  const [outputVolume, setOutputVolume] = useState([80])
  const [searchQuery, setSearchQuery] = useState("")

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

  const systemInfo = {
    // Hardware
    ram: "16 GB",
    ramUsed: "5.2 GB",
    ramAvailable: "10.8 GB",
    cpu: "Intel Core i7-12700K",
    cpuCores: "12 cores (8P + 4E)",
    cpuUsage: "23%",
    gpu: "NVIDIA GeForce RTX 4070",
    storage: "1 TB NVMe SSD",
    storageUsed: "456 GB",
    storageAvailable: "568 GB",

    // System
    os: "Windows 11 Pro",
    osVersion: "23H2 (Build 22631.3007)",
    architecture: "x64",
    uptime: "2 days, 14 hours",

    // Network
    networkStatus: "Connected",
    networkType: "Wi-Fi 6",
    ipAddress: "192.168.1.105",

    // SpeechCoach specific
    modelsPath: "C:\\Users\\User\\AppData\\Local\\SpeechCoach\\Models",
    dataPath: "C:\\Users\\User\\AppData\\Local\\SpeechCoach\\Data",
    cacheSize: "2.3 GB",
    totalSessions: 47,
    totalPracticeTime: "8 hours 32 minutes",
  }

  const speechCoachInfo = {
    version: "1.2.3",
    buildNumber: "20240127.1",
    releaseDate: "January 27, 2024",
    license: "MIT License",
    platform: "Desktop (Windows/macOS/Linux)",
    framework: "Electron + React",
    aiFramework: "Ollama + Transformers.js",

    // Features
    supportedLanguages: 12,
    availableModels: 8,
    offlineCapable: true,
    privacyFirst: true,

    // Developer info
    developer: "SpeechCoach Team",
    website: "https://speechcoach.ai",
    support: "support@speechcoach.ai",
    github: "https://github.com/speechcoach/speechcoach",

    // Legal
    copyright: "© 2024 SpeechCoach. All rights reserved.",
    thirdPartyLicenses: "View Third-Party Licenses",
  }

  const handleModelAction = (modelId: string, action: "download" | "delete" | "use") => {
    console.log(`${action} model:`, modelId)
    if (action === "use") {
      const model = models.find((m) => m.id === modelId)
      if (model) {
        onModelSelect(model.name)
      }
    }
  }

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.family.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* Left Navigation Panel - Desktop Only */}
      <div className="w-72 hidden lg:flex bg-white/60 backdrop-blur-xl border-r border-purple-100 flex-col">
        {/* Header */}
        <div className="p-6 border-b border-purple-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("conversation")}
            className="mb-4 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-gray-500">Configure your AI</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-6 space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "models"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("models")}
          >
            <Brain className="h-4 w-4 mr-3" />
            AI Models
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "language"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("language")}
          >
            <Globe className="h-4 w-4 mr-3" />
            Default Language
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "audio"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("audio")}
          >
            <Volume2 className="h-4 w-4 mr-3" />
            Audio Settings
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "system"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("system")}
          >
            <Cpu className="h-4 w-4 mr-3" />
            System Info
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "storage"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("storage")}
          >
            <Database className="h-4 w-4 mr-3" />
            Storage & Paths
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start rounded-xl ${
              activeTab === "about"
                ? "bg-gradient-to-r from-purple-100 to-orange-100 text-purple-700 hover:from-purple-200 hover:to-orange-200"
                : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            onClick={() => setActiveTab("about")}
          >
            <Sparkles className="h-4 w-4 mr-3" />
            About
          </Button>
        </div>

        {/* System Status */}
        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">System Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">RAM Usage</span>
                <span className="font-medium text-blue-600">5.2 GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Models</span>
                <span className="font-medium text-green-600">2 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center space-x-3">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("conversation")}
                className="lg:hidden text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
                  {activeTab === "models" && "AI Model Management"}
                  {activeTab === "language" && "Default Language Settings"}
                  {activeTab === "audio" && "Audio Configuration"}
                  {activeTab === "system" && "System Information"}
                  {activeTab === "storage" && "Storage & Paths Configuration"}
                  {activeTab === "about" && "About SpeechCoach"}
                </h2>
                <p className="text-sm lg:text-base text-gray-600">
                  {activeTab === "models" && "Download and configure language models"}
                  {activeTab === "language" && "Set your preferred default language"}
                  {activeTab === "audio" && "Configure microphone and speaker settings"}
                  {activeTab === "system" && "View system specifications and performance"}
                  {activeTab === "storage" && "Configure application storage locations and manage data"}
                  {activeTab === "about" && "Learn more about SpeechCoach and its features"}
                </p>
              </div>
            </div>
            {activeTab === "models" && (
              <Badge className="bg-gradient-to-r from-purple-500 to-orange-500 text-white border-0 rounded-full px-4 py-2">
                {models.filter((m) => m.isDownloaded).length} Downloaded
              </Badge>
            )}
            {activeTab === "language" && (
              <Badge className="bg-gradient-to-r from-purple-500 to-orange-500 text-white border-0 rounded-full px-4 py-2">
                Current: {currentLanguage}
              </Badge>
            )}
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="lg:hidden mb-4">
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {[
                { id: "models", label: "Models", icon: Brain },
                { id: "language", label: "Language", icon: Globe },
                { id: "audio", label: "Audio", icon: Volume2 },
                { id: "system", label: "System", icon: Cpu },
                { id: "storage", label: "Storage", icon: Database },
                { id: "about", label: "About", icon: Sparkles },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="sm"
                  className={`flex-shrink-0 rounded-lg ${
                    activeTab === tab.id ? "bg-white text-purple-700 shadow-sm" : "text-gray-600 hover:text-purple-600"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4 mr-1" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Search Bar for Models */}
          {activeTab === "models" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl bg-white/60"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === "models" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
              {/* System Info Card */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Cpu className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">System Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <HardDrive className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-800">RAM Available</p>
                        <p className="text-sm text-gray-600">{systemInfo.ram}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <Cpu className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Processor</p>
                        <p className="text-sm text-gray-600">{systemInfo.cpu}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <Brain className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-800">AI Status</p>
                        <p className="text-sm text-gray-600">Ready</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Cards */}
              {filteredModels.map((model) => (
                <Card
                  key={model.id}
                  className={`bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-300 hover:shadow-xl ${
                    selectedModel === model.name
                      ? "ring-2 ring-purple-400 bg-gradient-to-r from-purple-50 to-orange-50"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg flex items-center space-x-3">
                          <span className="text-gray-800">{model.name}</span>
                          {model.isRecommended && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-full px-2 py-1 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {model.family}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {model.ramRequired}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-600 text-sm">{model.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {model.downloadProgress !== undefined && (
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-blue-600">Downloading...</span>
                          <span className="text-blue-600">{model.downloadProgress}%</span>
                        </div>
                        <Progress value={model.downloadProgress} className="h-2 bg-blue-100" />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {model.isDownloaded ? (
                        <>
                          <Button
                            onClick={() => handleModelAction(model.id, "use")}
                            className={`flex-1 rounded-xl ${
                              selectedModel === model.name
                                ? "bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {selectedModel === model.name ? "Using" : "Use Model"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleModelAction(model.id, "delete")}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleModelAction(model.id, "download")}
                          disabled={model.downloadProgress !== undefined}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "language" && (
            <div className="max-w-2xl">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">Default Language Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred language for new conversations. You can always change it during a session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Default Language</label>
                    <Select value={currentLanguage} onValueChange={onLanguageChange}>
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

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This sets the default language for new conversations. You can change the
                      language anytime during a conversation using the language selector in the sidebar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "audio" && (
            <div className="max-w-4xl">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                      <Volume2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">Audio Configuration</span>
                  </CardTitle>
                  <CardDescription>Configure your microphone and speaker settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Mic className="h-4 w-4" />
                        <span>Microphone Device</span>
                      </label>
                      <Select value={microphoneDevice} onValueChange={setMicrophoneDevice}>
                        <SelectTrigger className="rounded-xl border-purple-200 focus:border-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Microphone</SelectItem>
                          <SelectItem value="usb-mic">USB Microphone</SelectItem>
                          <SelectItem value="headset">Headset Microphone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Speaker Device</span>
                      </label>
                      <Select value={speakerDevice} onValueChange={setSpeakerDevice}>
                        <SelectTrigger className="rounded-xl border-purple-200 focus:border-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Speaker</SelectItem>
                          <SelectItem value="headphones">Headphones</SelectItem>
                          <SelectItem value="bluetooth">Bluetooth Speaker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Input Volume: {inputVolume[0]}%</label>
                      <Slider
                        value={inputVolume}
                        onValueChange={setInputVolume}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Output Volume: {outputVolume[0]}%</label>
                      <Slider
                        value={outputVolume}
                        onValueChange={setOutputVolume}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl px-6">
                      Test Microphone
                    </Button>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl px-6">
                      Test Speaker
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "system" && (
            <div className="max-w-6xl space-y-6">
              {/* Hardware Information */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">Hardware Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* CPU */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <Cpu className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">Processor</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">{systemInfo.cpu}</p>
                        <p className="text-gray-600">{systemInfo.cpuCores}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-gray-600">Usage:</span>
                          <span className="font-medium text-blue-600">{systemInfo.cpuUsage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Memory */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <HardDrive className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-gray-800">Memory (RAM)</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">Total: {systemInfo.ram}</p>
                        <p className="text-gray-600">Used: {systemInfo.ramUsed}</p>
                        <p className="text-gray-600">Available: {systemInfo.ramAvailable}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "32%" }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Graphics */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <Zap className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-gray-800">Graphics</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">{systemInfo.gpu}</p>
                        <p className="text-gray-600">Hardware Acceleration: Enabled</p>
                        <p className="text-gray-600">AI Processing: Optimized</p>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-l-4 border-orange-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <Database className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-gray-800">Storage</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">{systemInfo.storage}</p>
                        <p className="text-gray-600">Used: {systemInfo.storageUsed}</p>
                        <p className="text-gray-600">Free: {systemInfo.storageAvailable}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Network */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-l-4 border-teal-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <Wifi className="h-5 w-5 text-teal-600" />
                        <span className="font-semibold text-gray-800">Network</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">Status: {systemInfo.networkStatus}</p>
                        <p className="text-gray-600">Type: {systemInfo.networkType}</p>
                        <p className="text-gray-600">IP: {systemInfo.ipAddress}</p>
                      </div>
                    </div>

                    {/* System Uptime */}
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                      <div className="flex items-center space-x-3 mb-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-gray-800">System</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">{systemInfo.os}</p>
                        <p className="text-gray-600">{systemInfo.osVersion}</p>
                        <p className="text-gray-600">Uptime: {systemInfo.uptime}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SpeechCoach Performance */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">SpeechCoach Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{systemInfo.totalSessions}</div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600 mb-1">{systemInfo.totalPracticeTime}</div>
                      <div className="text-sm text-gray-600">Practice Time</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{systemInfo.cacheSize}</div>
                      <div className="text-sm text-gray-600">Cache Size</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600 mb-1">2</div>
                      <div className="text-sm text-gray-600">Active Models</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="max-w-4xl space-y-6">
              {/* Application Paths */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">Application Paths</span>
                  </CardTitle>
                  <CardDescription>Configure where SpeechCoach stores models, data, and cache files</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Models Directory:</div>
                        <Button variant="outline" size="sm" className="text-xs bg-transparent">
                          Change
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border">
                        {systemInfo.modelsPath}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Location where AI language models are stored. Requires significant disk space.
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-400">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Data Directory:</div>
                        <Button variant="outline" size="sm" className="text-xs bg-transparent">
                          Change
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border">
                        {systemInfo.dataPath}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Location where conversation history, progress data, and settings are stored.
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-l-4 border-orange-400">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Cache Directory:</div>
                        <Button variant="outline" size="sm" className="text-xs bg-transparent">
                          Clear Cache
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border">
                        C:\Users\User\AppData\Local\SpeechCoach\Cache
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Temporary files and cached data. Safe to clear if experiencing issues.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Important Notes</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Changing paths requires restarting SpeechCoach</li>
                          <li>• Ensure sufficient disk space in new locations</li>
                          <li>• Models directory should be on a fast SSD for best performance</li>
                          <li>• Backup your data directory before making changes</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Usage */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <HardDrive className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-800">Storage Usage</span>
                  </CardTitle>
                  <CardDescription>Monitor disk space usage by SpeechCoach components</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">AI Models</span>
                          <span className="text-lg font-bold text-blue-600">2.1 GB</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">2 models downloaded</p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">Conversation Data</span>
                          <span className="text-lg font-bold text-green-600">45.2 MB</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">47 sessions stored</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">Cache & Temp</span>
                          <span className="text-lg font-bold text-orange-600">128 MB</span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Audio cache and temp files</p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">Total Usage</span>
                          <span className="text-lg font-bold text-purple-600">2.3 GB</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">All SpeechCoach files</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl bg-transparent"
                    >
                      Clear Cache
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "about" && (
            <div className="max-w-4xl space-y-6">
              {/* Main About Card */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-orange-500 rounded-2xl flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                        SpeechCoach
                      </CardTitle>
                      <CardDescription className="text-lg text-gray-600">
                        AI-Powered Language Learning Through Natural Conversation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="font-semibold text-gray-800 mb-2">Version Information</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Version:</span>
                            <span className="font-medium text-blue-600">{speechCoachInfo.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Build:</span>
                            <span className="font-medium text-blue-600">{speechCoachInfo.buildNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Released:</span>
                            <span className="font-medium text-blue-600">{speechCoachInfo.releaseDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <div className="font-semibold text-gray-800 mb-2">Technical Details</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Platform:</span>
                            <span className="font-medium text-green-600">{speechCoachInfo.platform}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Framework:</span>
                            <span className="font-medium text-green-600">{speechCoachInfo.framework}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">AI Engine:</span>
                            <span className="font-medium text-green-600">{speechCoachInfo.aiFramework}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <div className="font-semibold text-gray-800 mb-2">Features</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Languages:</span>
                            <span className="font-medium text-purple-600">{speechCoachInfo.supportedLanguages}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">AI Models:</span>
                            <span className="font-medium text-purple-600">{speechCoachInfo.availableModels}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Offline Mode:</span>
                            <span className="font-medium text-purple-600">
                              {speechCoachInfo.offlineCapable ? "✓ Yes" : "✗ No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Privacy First:</span>
                            <span className="font-medium text-purple-600">
                              {speechCoachInfo.privacyFirst ? "✓ Yes" : "✗ No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                        <div className="font-semibold text-gray-800 mb-2">Contact & Support</div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Developer:</span>
                            <span className="font-medium text-orange-600 ml-2">{speechCoachInfo.developer}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Website:</span>
                            <a
                              href={speechCoachInfo.website}
                              className="font-medium text-orange-600 ml-2 hover:underline"
                            >
                              {speechCoachInfo.website}
                            </a>
                          </div>
                          <div>
                            <span className="text-gray-600">Support:</span>
                            <a
                              href={`mailto:${speechCoachInfo.support}`}
                              className="font-medium text-orange-600 ml-2 hover:underline"
                            >
                              {speechCoachInfo.support}
                            </a>
                          </div>
                          <div>
                            <span className="text-gray-600">GitHub:</span>
                            <a
                              href={speechCoachInfo.github}
                              className="font-medium text-orange-600 ml-2 hover:underline"
                            >
                              View Source Code
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-l-4 border-purple-400">
                    <h3 className="font-semibold text-gray-800 mb-3">About SpeechCoach</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      SpeechCoach is an innovative AI-powered language learning application that helps users master new
                      languages through natural conversation practice. Unlike traditional language learning apps,
                      SpeechCoach focuses on real-time conversation skills, providing instant feedback on grammar,
                      pronunciation, and fluency.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Built with privacy in mind, all AI processing happens locally on your device. No internet
                      connection is required for core functionality, ensuring your conversations remain completely
                      private and secure.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">100% Offline Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Advanced AI Models</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700">12+ Languages Supported</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-gray-700">Real-time Feedback</span>
                      </div>
                    </div>
                  </div>

                  {/* License and Legal */}
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">{speechCoachInfo.copyright}</p>
                      <p className="text-sm text-gray-600">Licensed under {speechCoachInfo.license}</p>
                      <button className="text-sm text-blue-600 hover:underline">
                        {speechCoachInfo.thirdPartyLicenses}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
