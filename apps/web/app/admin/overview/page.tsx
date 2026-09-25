'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Users, Building2, DollarSign, Globe, TrendingUp, Activity, Shield, Clock, ArrowRight, UserPlus, Wallet, RefreshCw, FileText, CheckCircle2, XCircle, AlertTriangle, Star, Search, Loader2, Trash2 } from 'lucide-react'
import { storage } from '@/lib/storage'
import { auditLogger } from '@/lib/security'

export default function AdminOverview() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [websites, setWebsites] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [allWallets, setAllWallets] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [featuredSearch, setFeaturedSearch] = useState('')
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [featError, setFeatError] = useState('')
  const [featSuccess, setFeatSuccess] = useState('')

  const loadFeaturedProviders = async () => {
    setFeaturedLoading(true)
    setFeatError('')
    try {
      const res = await fetch('/api/admin/featured-providers')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      const list = json.data || []
      setFeaturedIds(list.map((p: any) => p.provider_id))
    } catch {
      setFeatError('Could not load featured providers')
    } finally {
      setFeaturedLoading(false)
    }
  }

  const toggleFeatured = async (provider: any) => {
    const pid = provider.id || provider.email
    setTogglingId(pid)
    setFeatError('')
    setFeatSuccess('')
    try {
      if (featuredIds.includes(pid)) {
        const res = await fetch(`/api/admin/featured-providers?id=${encodeURIComponent(pid)}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to unfeature')
        setFeatSuccess('Removed from featured')
        auditLogger.log('unfeature', admin?.id || pid, admin?.email || 'Admin', `Removed ${provider.businessName || provider.name || pid} from featured providers`)
      } else {
        const res = await fetch('/api/admin/featured-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: pid,
            businessName: provider.businessName || provider.fullName || provider.name || provider.business_name || 'Provider',
            logoUrl: provider.logoUrl || provider.logo_url || provider.avatar || '',
            primaryCategory: provider.category || provider.primary_category || provider.service || '',
            city: provider.city || '',
            state: provider.state || '',
            description: provider.description || provider.tagline || '',
          }),
        })
        if (!res.ok) throw new Error('Failed to feature')
        setFeatSuccess('Added to featured')
        auditLogger.log('feature', admin?.id || pid, admin?.email || 'Admin', `Featured ${provider.businessName || provider.name || pid} as top service provider`)
      }
      loadFeaturedProviders()
    } catch {
      setFeatError('Operation failed')
    } finally {
      setTogglingId(null)
    }
  }

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') { router.push('/login'); return }
    setAdmin(currentAdmin)

    const registered = storage.get('registered_users') || []
    const registeredProviders = storage.get('registered_providers') || []
    const userWallet = storage.getWallet() || { balance: 0, transactions: [] }
    const savedWallets = storage.get('all_wallets') || []
    const savedOrders = storage.get('user_orders') || []

    setUsers(registered)
    setProviders(registeredProviders)
    setWallet(userWallet)
    setAllWallets(savedWallets)
    setOrders(savedOrders)

    // Fetch live users from Supabase DB and merge with localStorage
    fetch('/api/admin/data?type=users', { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data?.length > 0) {
          const apiUsers = json.data
          const apiCustomers = apiUsers.filter((u: any) => u.userType !== 'provider')
          const apiProviders = apiUsers.filter((u: any) => u.userType === 'provider')
          if (apiCustomers.length > 0 || apiProviders.length > 0) {
            setUsers(apiCustomers)
            setProviders(apiProviders)
            storage.set('registered_users', apiCustomers)
            storage.set('registered_providers', apiProviders)
          }
        }
      })
      .catch(() => {})

    // Fetch live website count from Supabase DB
    fetch('/api/admin/websites?limit=500', { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          setWebsites(json.data)
        }
      })
      .catch(() => {})

    auditLogger.log('login', currentAdmin.id || 'admin', currentAdmin.email || 'Admin', 'Accessed admin overview dashboard')

    const allTxns: any[] = []
    ;[userWallet, ...savedWallets].forEach((w: any) => {
      if (w?.transactions) allTxns.push(...w.transactions.map((t: any) => ({ ...t, walletUser: w.userId || w.userName || 'Unknown' })))
    })
    if (allTxns.length === 0 && userWallet.transactions) allTxns.push(...userWallet.transactions)
    allTxns.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
    setTransactions(allTxns.slice(0, 10))

    loadFeaturedProviders()

    return () => window.removeEventListener('error', errorHandler)
  }, [])

  const totalRevenue = [wallet, ...allWallets].reduce((sum: number, w: any) => sum + (w?.balance || 0), 0)
  const platformFee = 0.05
  const recentSignups = [...users, ...providers].sort((a: any, b: any) => new Date(b.createdAt || b.joinedDate || 0).getTime() - new Date(a.createdAt || a.joinedDate || 0).getTime()).slice(0, 5)

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  const stats = [
    { icon: Users, label: 'Total Users', value: users.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Building2, label: 'Providers', value: providers.length.toString(), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: DollarSign, label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Globe, label: 'Active Websites', value: websites.length.toString(), color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: TrendingUp, label: 'Platform Fee', value: `${(platformFee * 100).toFixed(1)}%`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Activity, label: 'Transactions', value: transactions.length.toString(), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  const quickActions = [
    { label: 'View All Users', icon: Users, href: '/admin/people', color: 'text-blue-400' },
    { label: 'View All Providers', icon: Building2, href: '/admin/people?tab=providers', color: 'text-green-400' },
    { label: 'System Health', icon: Shield, href: '/admin/system', color: 'text-purple-400' },
    { label: 'Generate Report', icon: FileText, href: '/admin/money', color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-white/60 mt-1">Platform analytics at a glance</p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/60 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" />User Growth (7 days)</h2>
            <span className="text-xs text-white/40">Last 7 days</span>
          </div>
          <div className="flex items-center justify-center h-40 text-white/40 text-sm">
            {users.length > 0 || providers.length > 0 ? (
              <p>{users.length + providers.length} total registered — tracking will populate as users join</p>
            ) : (
              <p>No signups yet — growth chart will appear once users register</p>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" />Revenue Trend</h2>
            <span className="text-xs text-white/40">₦{totalRevenue.toLocaleString()} total</span>
          </div>
          <div className="flex items-center justify-center h-40 text-white/40 text-sm">
            {transactions.length > 0 ? (
              <p>{transactions.length} transactions recorded — chart will render as volume grows</p>
            ) : (
              <p>No transactions yet — revenue chart will appear once platform is active</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" />Recent Activity</h2>
          <div className="space-y-3">
            {transactions.length > 0 ? transactions.slice(0, 5).map((txn: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${txn.type === 'deposit' ? 'bg-green-500/20 text-green-400' : txn.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {txn.type === 'deposit' ? '+' : txn.type === 'withdrawal' ? '-' : '↔'}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{txn.type || 'Transaction'}</p>
                    <p className="text-xs text-white/40">₦{(txn.amount || 0).toLocaleString()} • {txn.date ? new Date(txn.date).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${txn.status === 'completed' || txn.status === 'success' ? 'bg-green-500/20 text-green-400' : txn.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {txn.status || 'completed'}
                </span>
              </div>
            )) : <p className="text-white/40 text-sm">No recent transactions</p>}
            {recentSignups.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Latest Signups</p>
                {recentSignups.slice(0, 3).map((u: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <UserPlus className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white">{u.fullName || u.name || u.email || 'User'}</span>
                    <span className="text-xs text-white/40">{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-purple-400" />Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => router.push(action.href)} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-left transition-all">
                <action.icon className={`w-6 h-6 ${action.color} mb-2`} />
                <p className="text-sm text-white font-medium">{action.label}</p>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all mt-1" />
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">Platform Health</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/60">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Service Providers Management */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" />Top Service Providers</h2>
          <button onClick={loadFeaturedProviders} className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${featuredLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {featError && <p className="text-red-400 text-sm mb-3">{featError}</p>}
        {featSuccess && <p className="text-green-400 text-sm mb-3">{featSuccess}</p>}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={featuredSearch}
            onChange={e => setFeaturedSearch(e.target.value)}
            placeholder="Search providers..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {providers.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">No providers found</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
              {providers
                .filter(p => {
                  const q = featuredSearch.toLowerCase()
                  const name = p.businessName || p.fullName || p.name || p.business_name || ''
                  const cat = p.category || p.primary_category || p.service || ''
                  const town = p.city || ''
                  return !q || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || town.toLowerCase().includes(q)
                })
                .sort((a, b) => {
                  const aId = a.id || a.email || ''
                  const bId = b.id || b.email || ''
                  const aF = featuredIds.includes(aId)
                  const bF = featuredIds.includes(bId)
                  return aF === bF ? 0 : aF ? -1 : 1
                })
                .map((provider) => {
                  const pid = provider.id || provider.email || ''
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                          isFeatured ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'
                        }`}>
                          {provider.logoUrl || provider.logo_url || provider.avatar ? (
                            <img src={provider.logoUrl || provider.logo_url || provider.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{provider.businessName || provider.fullName || provider.name || provider.business_name || 'Unnamed'}</p>
                          <p className="text-xs text-white/40 truncate">
                            {[provider.category || provider.primary_category || provider.service, provider.city, provider.state].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeatured(provider)}
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
          <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400/70">
              <Star className="w-3 h-3 inline mr-1" />
              {featuredIds.length} provider{featuredIds.length !== 1 ? 's' : ''} currently featured on homepage
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
