"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, BookOpen, Zap } from "lucide-react"

interface FeedbackButtonsProps {
  onFeedbackRequest: (type: "grammar" | "fluency" | "correction") => void
}

export function FeedbackButtons({ onFeedbackRequest }: FeedbackButtonsProps) {
  return (
    <div className="px-6 py-4 bg-white/60 backdrop-blur-sm border-t border-purple-100">
      <div className="flex justify-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFeedbackRequest("grammar")}
          className="text-xs border-green-200 text-green-700 hover:bg-green-50 rounded-full px-4 py-2 bg-white/80"
        >
          <BookOpen className="h-3 w-3 mr-2" />
          Grammar Help
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFeedbackRequest("fluency")}
          className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full px-4 py-2 bg-white/80"
        >
          <Zap className="h-3 w-3 mr-2" />
          Fluency Tips
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFeedbackRequest("correction")}
          className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 rounded-full px-4 py-2 bg-white/80"
        >
          <MessageSquare className="h-3 w-3 mr-2" />
          Correct Me
        </Button>
      </div>
    </div>
  )
}
