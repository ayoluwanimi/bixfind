"use client"

import { cn } from "../../lib/utils"

export type CopilotMode = "find" | "help" | "build"

export interface ModeSelectorProps {
  currentMode: CopilotMode
  onModeChange: (mode: CopilotMode) => void
  className?: string
}

const modes: Array<{ key: CopilotMode; label: string; description: string }> = [
  { key: "find", label: "Find", description: "Search services" },
  { key: "help", label: "Help", description: "Platform Q&A" },
  { key: "build", label: "Build", description: "Website builder" },
]

export function ModeSelector({ currentMode, onModeChange, className }: ModeSelectorProps) {
  return (
    <div className={cn("flex border-b border-white/10 bg-gray-900/50 px-2", className)}>
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          className={cn(
            "relative flex-1 px-3 py-2 text-center text-xs font-medium transition-colors",
            currentMode === key
              ? "text-blue-400"
              : "text-white/40 hover:text-white/70",
          )}
        >
          {label}
          {currentMode === key && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-blue-500" />
          )}
        </button>
      ))}
    </div>
  )
}
