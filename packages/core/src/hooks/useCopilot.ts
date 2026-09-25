"use client"

import { useState, useCallback, useRef } from "react"

export type CopilotMode = "find" | "help" | "build"

export interface CopilotMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface UseCopilotOptions {
  initialMode?: CopilotMode
  initialOpen?: boolean
  onError?: (error: Error) => void
}

export interface UseCopilotReturn {
  isOpen: boolean
  mode: CopilotMode
  messages: CopilotMessage[]
  isThinking: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setMode: (mode: CopilotMode) => void
  sendMessage: (text: string) => Promise<void>
  clearMessages: () => void
}

export function useCopilot(opts: UseCopilotOptions = {}): UseCopilotReturn {
  const { initialMode = "find", initialOpen = false, onError } = opts
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [mode, setModeState] = useState<CopilotMode>(initialMode)
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(initialMode),
      timestamp: new Date(),
    },
  ])
  const [isThinking, setIsThinking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const setMode = useCallback(
    (newMode: CopilotMode) => {
      setModeState(newMode)
      setMessages([
        {
          id: `welcome-${newMode}`,
          role: "assistant",
          content: getWelcomeMessage(newMode),
          timestamp: new Date(),
        },
      ])
    },
    [],
  )

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: `welcome-${mode}`,
        role: "assistant",
        content: getWelcomeMessage(mode),
        timestamp: new Date(),
      },
    ])
  }, [mode])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return

      const userMsg: CopilotMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsThinking(true)

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            mode,
            history: messages.slice(-10).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment.")
          }
          throw new Error(`Request failed: ${res.status}`)
        }

        const data = await res.json()
        const responseText = data.message?.content || data.response || data.text || "I couldn't process that."

        const assistantMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMsg])
      } catch (err: any) {
        if (err.name === "AbortError") return

        const errorMsg: CopilotMessage = {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: err.message || "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
        onError?.(err)
      } finally {
        setIsThinking(false)
      }
    },
    [mode, messages, isThinking, onError],
  )

  return {
    isOpen,
    mode,
    messages,
    isThinking,
    open,
    close,
    toggle,
    setMode,
    sendMessage,
    clearMessages,
  }
}

function getWelcomeMessage(mode: CopilotMode): string {
  const messages: Record<CopilotMode, string> = {
    find: "Hi! I can help you find services on Bixfind. Tell me what you're looking for.",
    help: "Need help using Bixfind? Ask me anything about bookings, payments, or your account.",
    build: "I can help you improve your provider profile. Tell me what you'd like to work on.",
  }
  return messages[mode]
}
