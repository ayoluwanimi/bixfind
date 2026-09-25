"use client"

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react"
import { Search, Mic, X, Clock, Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

export interface SearchBarProps {
  size?: "sm" | "md" | "lg"
  placeholder?: string
  onSearch: (value: string) => void
  defaultValue?: string
  className?: string
}

const SIZE_MAP = {
  sm: { input: "h-9 text-sm px-3", icon: "w-4 h-4", mic: "w-3.5 h-3.5" },
  md: { input: "h-11 text-base px-4", icon: "w-5 h-5", mic: "w-4 h-4" },
  lg: { input: "h-14 text-lg px-6", icon: "w-6 h-6", mic: "w-5 h-5" },
}

const RECENT_KEY = "bixfind_recent_searches"

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentSearch(term: string) {
  try {
    const existing = getRecentSearches().filter((s) => s !== term)
    const updated = [term, ...existing].slice(0, 8)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}

export function SearchBar({
  size = "md",
  placeholder = "Search services, providers, categories...",
  onSearch,
  defaultValue = "",
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const sizes = SIZE_MAP[size]

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value.trim())
      }
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, onSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowRecent(false)
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = useCallback(
    (term?: string) => {
      const q = (term || value).trim()
      if (!q) return
      saveRecentSearch(q)
      setRecentSearches(getRecentSearches())
      onSearch(q)
      setShowRecent(false)
      inputRef.current?.blur()
    },
    [value, onSearch],
  )

  const handleVoiceInput = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsListening(!isListening)
      return
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsListening(!isListening)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setValue(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }, [isListening])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showRecent || recentSearches.length === 0) {
      if (e.key === "Enter") handleSubmit()
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < recentSearches.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : recentSearches.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < recentSearches.length) {
          handleSubmit(recentSearches[highlightedIndex])
        } else {
          handleSubmit()
        }
        break
      case "Escape":
        setShowRecent(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleClear = () => {
    setValue("")
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-all duration-200",
          "bg-white/10 backdrop-blur-xl",
          "border-white/20 hover:border-white/30",
          "shadow-lg shadow-black/5",
          isFocused && "border-blue-400/50 ring-2 ring-blue-400/20 bg-white/15",
          sizes.input,
        )}
      >
        <Search className={cn("text-white/60 shrink-0", sizes.icon)} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setHighlightedIndex(-1) }}
          onFocus={() => { setIsFocused(true); setShowRecent(true) }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-white placeholder-white/40",
            "ml-2 mr-2",
          )}
          aria-label="Search"
        />
        {value && (
          <button onClick={handleClear} className="p-1 text-white/50 hover:text-white/80 transition-colors" aria-label="Clear search">
            <X className={cn(sizes.mic)} />
          </button>
        )}
        <button
          onClick={handleVoiceInput}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isListening ? "text-red-400 bg-red-400/10 animate-pulse" : "text-white/50 hover:text-white/80 hover:bg-white/10",
          )}
          aria-label="Voice search"
        >
          <Mic className={cn(sizes.mic)} />
        </button>
      </div>

      {showRecent && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50">
          <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Recent</div>
          {recentSearches.map((term, idx) => (
            <button
              key={term}
              onClick={() => handleSubmit(term)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors",
                highlightedIndex === idx ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <span className="truncate">{term}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
