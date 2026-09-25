"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, Send } from "lucide-react"
import { cn } from "../../lib/utils"
import { ModeSelector, type CopilotMode } from "./ModeSelector"
import { ChatMessage } from "./ChatMessage"
import { SuggestionChips } from "./SuggestionChips"
import { ThinkingIndicator } from "./ThinkingIndicator"

export interface CopilotPanelProps {
  onClose: () => void
  className?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const WELCOME_MESSAGES: Record<CopilotMode, { title: string; message: string; suggestions: string[] }> = {
  find: {
    title: "Find a service",
    message: "Hi! I can help you find services on Bixfind. Tell me what you're looking for.",
    suggestions: ["Plumber under ₦15k", "Best fashion stores in Lagos", "Phone repair near me", "Wedding photographers"],
  },
  help: {
    title: "Get help",
    message: "Need help using Bixfind? Ask me anything about bookings, payments, or your account.",
    suggestions: ["How do bookings work?", "What is escrow?", "How do I get verified?", "Refund policy"],
  },
  build: {
    title: "Build your website",
    message: "I can help you improve your provider profile. Make your hero punchier, get color suggestions, or write product descriptions.",
    suggestions: ["Make my hero text punchier", "Suggest colors for my logo", "Write a product description", "Improve my bio"],
  },
}

export function CopilotPanel({ onClose, className }: CopilotPanelProps) {
  const [mode, setMode] = useState<CopilotMode>("find")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: WELCOME_MESSAGES.find.message,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  function handleModeChange(newMode: CopilotMode) {
    setMode(newMode)
    setMessages([{
      id: "welcome-" + newMode,
      role: "assistant",
      content: WELCOME_MESSAGES[newMode].message,
      timestamp: new Date(),
    }])
  }

  function handleSend(text: string) {
    if (!text.trim() || isThinking) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsThinking(true)

    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, mode, history: messages }),
    })
      .then((res) => res.json())
      .then((data) => {
        const assistantMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response ?? data.text ?? "I couldn't process that. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I'm having trouble connecting. Please try again.",
            timestamp: new Date(),
          },
        ])
      })
      .finally(() => setIsThinking(false))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const currentWelcome = WELCOME_MESSAGES[mode]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "fixed bottom-24 right-6 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-white" />
          <span className="text-sm font-semibold text-white">Bixfind Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="sr-only">Close</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "400px" }}>
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ChatMessage message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && <ThinkingIndicator />}

        {messages.length === 1 && !isThinking && (
          <SuggestionChips
            suggestions={currentWelcome.suggestions}
            onSelect={handleSend}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask me about ${mode === "find" ? "services" : mode === "help" ? "Bixfind" : "your website"}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            disabled={isThinking}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isThinking}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
