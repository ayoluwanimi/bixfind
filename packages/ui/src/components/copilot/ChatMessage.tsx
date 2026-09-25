"use client"

import { cn } from "../../lib/utils"
import { Bot, User } from "lucide-react"

export interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
  }
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-500" : "bg-purple-500",
        )}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-blue-500/20 text-white"
            : "rounded-tl-sm bg-white/5 text-white/90",
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
