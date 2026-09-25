"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface ChatDrawerProps {
  conversations: Conversation[]
  unreadCount: number
  onConversationClick: (conversation: Conversation) => void
  onSeeAll?: () => void
  className?: string
  iconSize?: number
}

export function ChatDrawer({
  conversations,
  unreadCount,
  onConversationClick,
  onSeeAll,
  className,
  iconSize = 20,
}: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const slideInVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 25, stiffness: 250 } },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.15 } },
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
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

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <MessageSquare size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              variants={slideInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-gray-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Messages</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <MessageSquare size={40} className="text-white/20 mb-3" />
                    <p className="text-sm text-white/40">No conversations yet</p>
                    <p className="text-xs text-white/20 mt-1 text-center">
                      Start chatting with a provider to see your conversations here
                    </p>
                  </div>
                ) : (
                  conversations.slice(0, 5).map((conv) => (
                    <button
                      key={conv.id || conv.participantId}
                      onClick={() => { onConversationClick(conv); setIsOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {conv.participantAvatar ? (
                            <img src={conv.participantAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            conv.participantName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">{conv.participantName}</p>
                          <span className="text-[10px] text-white/30 shrink-0 ml-2">{formatTime(conv.lastMessageTime)}</span>
                        </div>
                        <p className="text-xs text-white/40 truncate mt-0.5">{conv.lastMessage || "No messages yet"}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {conversations.length > 0 && (
                <div className="border-t border-white/10 p-2">
                  {onSeeAll && (
                    <button
                      onClick={() => { onSeeAll(); setIsOpen(false) }}
                      className="flex items-center justify-center gap-1 w-full py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      See all messages
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
