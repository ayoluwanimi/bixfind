"use client"

import { cn } from "../../lib/utils"
import { MessageSquare } from "lucide-react"
import type { Conversation } from "@bixfind/core"

export interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (conversation: Conversation) => void
  isLoading?: boolean
  className?: string
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Now"
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  } catch {
    return ""
  }
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  isLoading,
  className,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2 p-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-white/10" />
              <div className="h-2.5 w-48 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MessageSquare size={40} className="text-white/20 mb-3" />
        <p className="text-sm text-white/40">No conversations yet</p>
        <p className="text-xs text-white/20 mt-1 text-center">
          Start chatting with a provider to see your conversations here
        </p>
      </div>
    )
  }

  return (
    <div className={cn("divide-y divide-white/5", className)}>
      {conversations.map((conv) => {
        const p = conv.provider ?? conv.customer
        const participant = p as { business_name?: string; full_name?: string; logo_url?: string; avatar_url?: string } | undefined
        const name = participant?.business_name ?? participant?.full_name ?? "Unknown"
        const avatar = participant?.logo_url ?? participant?.avatar_url
        const initial = name.charAt(0).toUpperCase()
        const unread = conv.unread_customer > 0

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
              conv.id === activeId && "bg-white/10",
            )}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              {unread && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {conv.unread_customer > 9 ? "9+" : conv.unread_customer}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">{name}</p>
                <span className="text-[10px] text-white/30 shrink-0 ml-2">
                  {formatTime(conv.last_message_at)}
                </span>
              </div>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {conv.last_message_body || "No messages yet"}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
