"use client"

import { cn } from "../../lib/utils"
import { Bot } from "lucide-react"

export interface ThinkingIndicatorProps {
  className?: string
}

export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500">
        <Bot size={14} className="text-white" />
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
      </div>
    </div>
  )
}
