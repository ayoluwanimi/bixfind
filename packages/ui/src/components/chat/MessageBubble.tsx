"use client"

import { cn } from "../../lib/utils"
import { Check, CheckCheck, Mic, Image, Languages } from "lucide-react"
import { useState } from "react"
import type { Message } from "@bixfind/core"

export interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onTranslate?: (messageId: string) => void
  className?: string
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

const TRANSLATION_TARGETS = ["Pidgin", "Yoruba", "Igbo", "Hausa"]

export function MessageBubble({ message, isOwn, onTranslate, className }: MessageBubbleProps) {
  const [showTranslations, setShowTranslations] = useState(false)

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start", className)}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1",
          isOwn
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white/10 text-white/90 rounded-bl-md",
          message.pending && "opacity-60",
          message.failed && "opacity-50 border border-red-500/50",
        )}
      >
        {message.attachments?.map((att, i) => {
          if (att.type === "image") {
            return (
              <img
                key={i}
                src={att.url}
                alt="Shared image"
                className="max-w-full rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            )
          }
          if (att.type === "voice") {
            return (
              <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                <Mic size={16} className="shrink-0" />
                <audio src={att.url} controls className="h-8 max-w-[180px]" preload="none" />
                <span className="text-xs opacity-60">{att.duration}s</span>
              </div>
            )
          }
          return null
        })}

        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>

        <div className="flex items-center gap-1.5 pt-0.5">
          <span className={cn("text-[10px]", isOwn ? "text-blue-200" : "text-white/40")}>
            {formatTime(message.created_at)}
          </span>

          {isOwn && (
            <span>
              {message.read_at ? (
                <CheckCheck size={12} className="text-blue-300" />
              ) : message.delivered_at ? (
                <CheckCheck size={12} className="text-white/40" />
              ) : (
                <Check size={12} className="text-white/40" />
              )}
            </span>
          )}

          {onTranslate && (
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
              title="Translate"
            >
              <Languages size={12} className={cn(isOwn ? "text-blue-200" : "text-white/40")} />
            </button>
          )}
        </div>
      </div>

      {showTranslations && onTranslate && (
        <div className="mt-1 flex flex-wrap gap-1 max-w-[75%]">
          {TRANSLATION_TARGETS.map((lang) => (
            <button
              key={lang}
              onClick={() => onTranslate(message.id)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
