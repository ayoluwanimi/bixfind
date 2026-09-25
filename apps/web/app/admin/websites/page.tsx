'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Search, RefreshCw, ExternalLink, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Building2, Clock, Filter } from 'lucide-react'
import { storage } from '@/lib/storage'

interface ProviderWebsite {
  id: string
  provider_id: string
  slug: string
  title: string
  tagline: string
  bio: string
  cover_image_url: string
  logo_url: string
  is_published: boolean
  created_at: string
  updated_at: string
  providers: {
    business_name: string
    business_email: string
    city: string
    state: string
    logo_url: string
  }
}

export default function AdminWebsitesPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [websites, setWebsites] = useState<ProviderWebsite[]>([])
  const [filtered, setFiltered] = useState<ProviderWebsite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [count, setCount] = useState(0)

  useEffect(() => {
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') { router.push('/login'); return }
    setAdmin(currentAdmin)
    fetchWebsites()
  }, [router])

  useEffect(() => {
    let result = websites
    if (filter === 'published') result = result.filter(w => w.is_published)
    else if (filter === 'draft') result = result.filter(w => !w.is_published)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(w =>
        w.slug.toLowerCase().includes(q) ||
        (w.title || '').toLowerCase().includes(q) ||
        (w.providers?.business_name || w.providers?.business_email || '').toLowerCase().includes(q) ||
        (w.tagline || '').toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [websites, search, filter])

  const fetchWebsites = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/websites?limit=500')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setWebsites(json.data || [])
      setCount(json.count || 0)
    } catch {
      setError('Could not load websites')
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (website: ProviderWebsite) => {
    setToggling(website.id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/websites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: website.id, is_published: !website.is_published }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSuccess(`${website.is_published ? 'Unpublished' : 'Published'} ${website.slug}`)
      fetchWebsites()
    } catch {
      setError('Operation failed')
    } finally {
      setToggling(null)
    }
  }

  const previewUrl = (slug: string) => `/p/${slug}`

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Provider Websites</h1>
          <p className="text-white/60 mt-1">Manage all provider mini-websites</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchWebsites} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by slug, title, provider name..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['all', 'published', 'draft'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-blue-600 text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              {f} {f === 'all' ? `(${websites.length})` : ''}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/30 whitespace-nowrap">{filtered.length} of {count}</div>
      </div>

      {success && <p className="text-green-400 text-sm">{success}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <Globe className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchWebsites} className="mt-3 px-4 py-2 bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <Globe className="w-12 h-12 text-white/10 mb-4" />
          <p className="text-white/40 text-sm">No websites found</p>
          <p className="text-white/20 text-xs mt-1">Websites will appear when providers create and save them</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map(website => {
              const providerName = website.providers?.business_name || 'Unknown'
              const location = [website.providers?.city, website.providers?.state].filter(Boolean).join(', ')
              return (
                <div key={website.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {website.logo_url || website.providers?.logo_url ? (
                      <img src={website.logo_url || website.providers?.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {website.title || website.slug}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        website.is_published
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {website.is_published ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {website.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                      <span>/p/{website.slug}</span>
                      <span>|</span>
                      <span>{providerName}</span>
                      {location && <><span>|</span><span>{location}</span></>}
                    </div>
                    {website.tagline && (
                      <p className="text-xs text-white/30 mt-0.5 truncate">{website.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/20">
                      <Clock className="w-3 h-3" />
                      <span>Updated {new Date(website.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={previewUrl(website.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                    <button
                      onClick={() => togglePublish(website)}
                      disabled={toggling === website.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        website.is_published
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {toggling === website.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : website.is_published ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      {website.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
