"use client"

import { cn } from "../../lib/utils"

export interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function SuggestionChips({ suggestions, onSelect, className }: SuggestionChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
