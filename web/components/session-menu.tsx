"use client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Trash2, Download, Copy, AlertCircle, RotateCcw } from "lucide-react"

interface SessionMenuProps {
  onClearConversation: () => void
  onExportConversation: () => void
  onCopyConversation: () => void
  onReportIssue: () => void
  onResetSession: () => void
  messagesCount: number
}

export function SessionMenu({
  onClearConversation,
  onExportConversation,
  onCopyConversation,
  onReportIssue,
  onResetSession,
  messagesCount,
}: SessionMenuProps) {
  const handleClear = () => {
    if (confirm("Are you sure you want to clear this conversation? This action cannot be undone.")) {
      onClearConversation()
    }
  }

  const handleExport = () => {
    onExportConversation()
  }

  const handleCopy = () => {
    onCopyConversation()
  }

  const handleReport = () => {
    onReportIssue()
  }

  const handleReset = () => {
    if (confirm("Reset the entire session? You will start a new conversation.")) {
      onResetSession()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-purple-100">
        <DropdownMenuLabel className="text-sm font-semibold text-gray-700">Session Options</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-100" />

        <DropdownMenuItem
          onClick={handleExport}
          className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50"
        >
          <Download className="h-4 w-4 mr-3 text-blue-500" />
          <span className="text-gray-700">Export Conversation</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer rounded-lg hover:bg-cyan-50 focus:bg-cyan-50">
          <Copy className="h-4 w-4 mr-3 text-cyan-500" />
          <span className="text-gray-700">Copy to Clipboard</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-purple-100" />

        <DropdownMenuItem
          onClick={handleReport}
          className="cursor-pointer rounded-lg hover:bg-amber-50 focus:bg-amber-50"
        >
          <AlertCircle className="h-4 w-4 mr-3 text-amber-500" />
          <span className="text-gray-700">Report Issue</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-purple-100" />

        <DropdownMenuItem
          onClick={handleReset}
          className="cursor-pointer rounded-lg hover:bg-orange-50 focus:bg-orange-50"
        >
          <RotateCcw className="h-4 w-4 mr-3 text-orange-500" />
          <span className="text-gray-700">Reset Session</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-purple-100" />

        <DropdownMenuItem onClick={handleClear} className="cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50">
          <Trash2 className="h-4 w-4 mr-3 text-red-500" />
          <span className="text-red-600 font-medium">Clear Conversation</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
