'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Star, MapPin, Filter, X } from 'lucide-react'
import Link from 'next/link'

type ProviderCard = {
  id: string
  slug: string
  businessName: string
  primaryCategory: string
  rating: number
  reviewCount: number
  isVerified: boolean
  badges: string[]
  thumbnailUrl: string
  location?: { lat: number; lng: number; address?: string }
  distance?: number
}

type SearchResult = {
  items: ProviderCard[]
  nextCursor?: string
  aiSummary?: string
  facets?: {
    categories: { name: string; count: number }[]
    ratings: { label: string; count: number }[]
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<string>('relevance')

  const doSearch = useCallback(async (q: string, sortBy?: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: '50' })
      if (sortBy && sortBy !== 'relevance') params.set('sort', sortBy)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      } else {
        setResults({ items: [], aiSummary: 'Search failed. Please try again.' })
      }
    } catch {
      setResults({ items: [], aiSummary: 'Search failed. Please try again.' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery, sort)
  }, [initialQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      doSearch(query.trim(), sort)
    }
  }

  const handleSort = (s: string) => {
    setSort(s)
    if (query.trim()) doSearch(query.trim(), s)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for services, providers..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults(null) }} className="absolute right-12 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </form>

        {results?.aiSummary && (
          <div className="mb-6 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-sm text-blue-200">
            {results.aiSummary}
          </div>
        )}

        {results?.facets && results.facets.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {results.facets.categories.map(cat => (
              <span key={cat.name} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                {cat.name} ({cat.count})
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/40">
            {results ? `${results.items.length} result${results.items.length !== 1 ? 's' : ''}` : 'Search for a service'}
          </p>
          {results && results.items.length > 0 && (
            <div className="flex gap-2">
              {['relevance', 'rating', 'distance'].map(s => (
                <button
                  key={s}
                  onClick={() => handleSort(s)}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${sort === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && results && results.items.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">No results found</h3>
            <p className="text-sm text-white/40">Try different keywords or browse categories</p>
          </div>
        )}

        {!loading && results && results.items.length > 0 && (
          <div className="space-y-3">
            {results.items.map(provider => (
              <Link
                key={provider.id}
                href={`/p/${provider.slug}`}
                className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {provider.businessName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {provider.businessName}
                      </h3>
                      {provider.isVerified && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-600/20 text-green-400 shrink-0">Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 mt-0.5">{provider.primaryCategory}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-white/60">{provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}</span>
                        <span className="text-xs text-white/30">({provider.reviewCount})</span>
                      </div>
                      {provider.location?.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-white/30" />
                          <span className="text-xs text-white/40 truncate">{provider.location.address}</span>
                        </div>
                      )}
                      {provider.distance != null && (
                        <span className="text-xs text-white/30">{provider.distance} km</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
