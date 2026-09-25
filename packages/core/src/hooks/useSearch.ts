"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"
import type { SearchQuery, SearchResult } from "@bixfind/validation"

interface UseSearchOptions {
  debounceMs?: number
  staleTime?: number
  gcTime?: number
  retryCount?: number
}

interface UseSearchReturn {
  results: SearchResult | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  search: (query: string) => void
  loadMore: () => void
  setFilters: (filters: Partial<SearchQuery>) => void
  clearSearch: () => void
  query: string
}

const DEFAULT_OPTIONS: UseSearchOptions = {
  debounceMs: 200,
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 5,
  retryCount: 2,
}

async function fetchSearch(params: URLSearchParams): Promise<SearchResult> {
  const res = await fetch(`/api/search?${params.toString()}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Search failed: ${res.status}`)
  }
  return res.json()
}

export function useSearch(opts: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs, staleTime, gcTime, retryCount } = { ...DEFAULT_OPTIONS, ...opts }
  const [query, setQuery] = useState("")
  const [filters, setFiltersState] = useState<Partial<SearchQuery>>({})
  const [cursor, setCursor] = useState<string | undefined>()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const queryClient = useQueryClient()

  const buildParams = useCallback(
    (cq: string, cf: Partial<SearchQuery>, c?: string): URLSearchParams => {
      const params = new URLSearchParams()
      if (cq) params.set("q", cq)
      if (cf.category) params.set("category", cf.category)
      if (cf.lat != null) params.set("lat", String(cf.lat))
      if (cf.lng != null) params.set("lng", String(cf.lng))
      if (cf.radiusKm != null) params.set("radiusKm", String(cf.radiusKm))
      if (cf.minRating != null) params.set("minRating", String(cf.minRating))
      if (cf.priceMin != null) params.set("priceMin", String(cf.priceMin))
      if (cf.priceMax != null) params.set("priceMax", String(cf.priceMax))
      if (cf.sort) params.set("sort", cf.sort)
      if (c) params.set("cursor", c)
      params.set("limit", String(cf.limit ?? 20))
      return params
    },
    [],
  )

  const searchKey = query || "__empty__"

  const { data, isLoading, isError, error } = useQuery<SearchResult>({
    queryKey: ["search", searchKey, filters, cursor],
    queryFn: () => fetchSearch(buildParams(query, filters, cursor)),
    staleTime,
    gcTime,
    retry: retryCount,
    enabled: !!query,
  })

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setQuery(q)
        setCursor(undefined)
      }, debounceMs)
    },
    [debounceMs],
  )

  const loadMore = useCallback(() => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor)
    }
  }, [data])

  const setFilters = useCallback((f: Partial<SearchQuery>) => {
    setFiltersState((prev) => ({ ...prev, ...f }))
    setCursor(undefined)
  }, [])

  const clearSearch = useCallback(() => {
    setQuery("")
    setFiltersState({})
    setCursor(undefined)
    queryClient.removeQueries({ queryKey: ["search"] })
  }, [queryClient])

  return {
    results: data ?? null,
    isLoading,
    isError,
    error: error ?? null,
    search,
    loadMore,
    setFilters,
    clearSearch,
    query,
  }
}
