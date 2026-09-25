"use client"

import { useEffect, useRef } from "react"
import { cn } from "../../lib/utils"
import { MessageBubble } from "./MessageBubble"
import { MessageInput } from "./MessageInput"
import { Loader2, ArrowDown } from "lucide-react"
import type { Message } from "@bixfind/core"

export interface ChatThreadProps {
  messages: Message[]
  currentUserId: string
  conversationName?: string
  onSend: (body: string, attachments?: { type: "image" | "voice"; url: string; duration?: number }[]) => void
  onTranslate?: (messageId: string) => void
  isSending?: boolean
  isLoading?: boolean
  className?: string
}

export function ChatThread({
  messages,
  currentUserId,
  conversationName,
  onSend,
  onTranslate,
  isSending,
  isLoading,
  className,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center flex-1", className)}>
        <Loader2 size={24} className="text-white/40 animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {conversationName && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-medium text-white">{conversationName}</p>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-white/30">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId || msg.pending
            const showAvatar =
              !isOwn &&
              (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id)

            return (
              <div key={msg.id} className={cn("flex flex-col", showAvatar && "mt-2")}>
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  onTranslate={onTranslate}
                />
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <button
        onClick={scrollToBottom}
        className="absolute bottom-20 right-6 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
        title="Scroll to bottom"
      >
        <ArrowDown size={16} />
      </button>

      <MessageInput onSend={onSend} isPending={isSending} />
    </div>
  )
}
