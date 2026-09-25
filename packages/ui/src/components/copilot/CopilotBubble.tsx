"use client"

import { useState } from "react"
import { Bot, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { CopilotPanel } from "./CopilotPanel"

export interface CopilotBubbleProps {
  className?: string
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function CopilotBubble({ className, defaultOpen = false, onToggle }: CopilotBubbleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    onToggle?.(next)
  }

  return (
    <>
      {isOpen && (
        <CopilotPanel onClose={() => { setIsOpen(false); onToggle?.(false) }} />
      )}

      <button
        onClick={handleToggle}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95",
          isOpen
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700",
          className,
        )}
        aria-label={isOpen ? "Close Copilot" : "Open Bixfind Copilot"}
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </button>
    </>
  )
}
