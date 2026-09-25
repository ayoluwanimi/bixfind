'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Search, Users, RefreshCw, Loader2, Trash2 } from 'lucide-react'
import { storage } from '@/lib/storage'
import { auditLogger } from '@/lib/security'

export default function TopProvidersPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState<'all' | 'featured' | 'unfeatured'>('all')

  useEffect(() => {
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') {
      router.push('/login')
      return
    }
    setAdmin(currentAdmin)

    const users: any[] = storage.get('registered_users') || []
    const providers: any[] = storage.get('registered_providers') || []

    const combined = [...users, ...providers]
    const seen = new Set<string>()
    const unique = combined.filter((u: any) => {
      const key = u.id || u.email
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    setAllUsers(unique)

    loadFeaturedIds()
  }, [])

  const loadFeaturedIds = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/featured-providers')
      if (res.ok) {
        const json = await res.json()
        setFeaturedIds((json.data || []).map((p: any) => p.provider_id))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (user: any) => {
    const pid = user.id || user.email
    setTogglingId(pid)
    setError('')
    setSuccess('')
    try {
      if (featuredIds.includes(pid)) {
        const res = await fetch(`/api/admin/featured-providers?id=${encodeURIComponent(pid)}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to unfeature')
        setSuccess('Removed from featured')
        auditLogger.log('unfeature', admin?.id || pid, admin?.email || 'Admin',
          `Removed ${user.businessName || user.fullName || user.name || pid} from featured providers`)
      } else {
        const res = await fetch('/api/admin/featured-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: pid,
            businessName: user.businessName || user.fullName || user.name || user.business_name || 'User',
            logoUrl: user.logoUrl || user.logo_url || user.avatar || '',
            primaryCategory: user.category || user.primary_category || user.service || '',
            city: user.city || '',
            state: user.state || '',
            description: user.description || user.tagline || '',
          }),
        })
        if (!res.ok) throw new Error('Failed to feature')
        setSuccess('Added to featured')
        auditLogger.log('feature', admin?.id || pid, admin?.email || 'Admin',
          `Featured ${user.businessName || user.fullName || user.name || pid} as top service provider`)
      }
      loadFeaturedIds()
    } catch (e: any) {
      setError(e.message || 'Operation failed')
    } finally {
      setTogglingId(null)
    }
  }

  if (!admin) {
    return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>
  }

  const filtered = allUsers
    .filter(u => {
      const q = search.toLowerCase()
      const name = u.businessName || u.fullName || u.name || u.business_name || ''
      const email = u.email || ''
      const cat = u.category || u.primary_category || u.service || ''
      const match = !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || cat.toLowerCase().includes(q)
      if (!match) return false
      const pid = u.id || u.email
      if (filter === 'featured') return featuredIds.includes(pid)
      if (filter === 'unfeatured') return !featuredIds.includes(pid)
      return true
    })
    .sort((a, b) => {
      const aF = featuredIds.includes(a.id || a.email || '')
      const bF = featuredIds.includes(b.id || b.email || '')
      return aF === bF ? 0 : aF ? -1 : 1
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Top Service Providers</h1>
        <p className="text-white/60 mt-1">Search any user and feature them on the homepage</p>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">{success}</p>}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or category..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'featured'
                ? 'bg-yellow-500 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setFilter('unfeatured')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'unfeatured'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Not Featured
          </button>
        </div>
        <button
          onClick={loadFeaturedIds}
          className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="text-xs text-white/30">
        Showing {filtered.length} of {allUsers.length} users
        &nbsp;·&nbsp; {featuredIds.length} featured
      </div>

      {filtered.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-8">No users found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const pid = user.id || user.email || ''
            const isFeatured = featuredIds.includes(pid)
            return (
              <div
                key={pid}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isFeatured
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    isFeatured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'
                  }`}>
                    {user.logoUrl || user.logo_url || user.avatar ? (
                      <img src={user.logoUrl || user.logo_url || user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.businessName || user.fullName || user.name || user.business_name || 'Unnamed'}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {user.email}
                      {user.category || user.primary_category || user.service ? ` \u00b7 ${user.category || user.primary_category || user.service}` : ''}
                      {user.city || user.state ? ` \u00b7 ${[user.city, user.state].filter(Boolean).join(', ')}` : ''}
                    </p>
                    <span className={`inline-block text-[10px] mt-0.5 px-1.5 py-0.5 rounded ${
                      user.businessName || user.business_name
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {user.businessName || user.business_name ? 'Provider' : 'User'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeatured(user)}
                  disabled={togglingId === pid}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                    isFeatured
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  }`}
                >
                  {togglingId === pid ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isFeatured ? (
                    <Trash2 className="w-3 h-3" />
                  ) : (
                    <Star className="w-3 h-3" />
                  )}
                  {isFeatured ? 'Remove' : 'Feature'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {featuredIds.length > 0 && (
        <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400/70">
            <Star className="w-3 h-3 inline mr-1" />
            {featuredIds.length} provider{featuredIds.length !== 1 ? 's' : ''} currently featured on homepage
          </p>
        </div>
      )}
    </div>
  )
}
