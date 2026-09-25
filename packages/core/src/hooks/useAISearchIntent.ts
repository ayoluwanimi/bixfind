"use client"

import { useCallback, useState } from "react"
import type { SearchIntent } from "@bixfind/ai"

export interface UseAISearchIntentOptions {
  debounceMs?: number
  onResult?: (intent: SearchIntent) => void
  onError?: (error: Error) => void
}

export interface UseAISearchIntentReturn {
  intent: SearchIntent | null
  isLoading: boolean
  error: string | null
  classify: (query: string) => Promise<SearchIntent | null>
}

const FALLBACK_INTENT: SearchIntent = {
  searchText: "",
  category: null,
  location: null,
  urgency: null,
  maxPrice: null,
  minRating: null,
  currency: "NGN",
  modifiers: [],
}

export function useAISearchIntent(opts: UseAISearchIntentOptions = {}): UseAISearchIntentReturn {
  const { onResult, onError } = opts
  const [intent, setIntent] = useState<SearchIntent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const classify = useCallback(
    async (query: string): Promise<SearchIntent | null> => {
      if (!query.trim()) {
        setIntent(FALLBACK_INTENT)
        return FALLBACK_INTENT
      }

      setIsLoading(true)
      setError(null)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 500)

        const res = await fetch("/api/ai/search-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          throw new Error(`Classification failed: ${res.status}`)
        }

        const data: SearchIntent = await res.json()
        data.searchText = data.searchText || query

        setIntent(data)
        onResult?.(data)
        return data
      } catch (err: any) {
        if (err.name === "AbortError") {
          const fallback: SearchIntent = {
            searchText: query,
            category: null,
            location: null,
            urgency: null,
            maxPrice: null,
            minRating: null,
            currency: "NGN",
            modifiers: [],
          }
          setIntent(fallback)
          onResult?.(fallback)
          return fallback
        }

        const errMsg = err.message || "Classification failed"
        setError(errMsg)
        onError?.(err)
        setIntent(FALLBACK_INTENT)
        return FALLBACK_INTENT
      } finally {
        setIsLoading(false)
      }
    },
    [onResult, onError],
  )

  return { intent, isLoading, error, classify }
}
