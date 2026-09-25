"use client"

import { useCallback, useState } from "react"

export interface SuggestionItem {
  label: string
  query: string
  category?: string | null
  emoji?: string | null
}

export interface UseAISuggestionsOptions {
  onError?: (error: Error) => void
}

export interface UseAISuggestionsReturn {
  suggestions: SuggestionItem[]
  isLoading: boolean
  error: string | null
  getSuggestions: (context: { query: string; category?: string }) => Promise<SuggestionItem[]>
}

export function useAISuggestions(opts: UseAISuggestionsOptions = {}): UseAISuggestionsReturn {
  const { onError } = opts
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSuggestions = useCallback(
    async (context: { query: string; category?: string }): Promise<SuggestionItem[]> => {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/ai/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Suggest 2-4 alternative search queries for a Bixfind user who searched for "${context.query}"${context.category ? ` in category "${context.category}"` : ""} and got no results. Return ONLY a JSON array of objects with "label" (display text), "query" (search query), "category" (Bixfind category or null), "emoji" (relevant emoji or null).`,
            systemPrompt: "You are a helpful assistant for Bixfind marketplace. Suggest alternative searches when users get empty results. Be practical and helpful.",
            maxTokens: 300,
            temperature: 0.7,
          }),
        })

        if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`)

        const data = await res.json()
        let parsed: SuggestionItem[]

        try {
          parsed = JSON.parse(data.text)
        } catch {
          parsed = [
            { label: "Browse all services", query: "", category: null, emoji: "🔍" },
            { label: "Try a different search", query: "", category: null, emoji: "💡" },
          ]
        }

        setSuggestions(parsed)
        return parsed
      } catch (err: any) {
        const errMsg = err.message || "Failed to get suggestions"
        setError(errMsg)
        onError?.(err)
        const fallback: SuggestionItem[] = [
          { label: "Browse all services", query: "", category: null, emoji: "🔍" },
        ]
        setSuggestions(fallback)
        return fallback
      } finally {
        setIsLoading(false)
      }
    },
    [onError],
  )

  return { suggestions, isLoading, error, getSuggestions }
}
