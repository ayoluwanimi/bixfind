'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarCheck, Users, DollarSign, TrendingUp, Settings, Calendar, Globe, Wallet, Clock, Activity, ArrowUpRight, Package, Music, Building2, ShoppingBag, Copy, ExternalLink, Link2, CheckCircle } from 'lucide-react'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'

const statCards = [
  { icon: CalendarCheck, label: "Today's Bookings", key: 'bookings', color: 'text-blue-400', bg: 'bg-blue-500/10', formatter: (v: number) => v.toString() },
  { icon: Users, label: 'Active Clients', key: 'clients', color: 'text-green-400', bg: 'bg-green-500/10', formatter: (v: number) => v.toString() },
  { icon: DollarSign, label: "Today's Revenue", key: 'revenue', color: 'text-emerald-400', bg: 'bg-emerald-500/10', formatter: (v: number) => `\u20A6${v.toLocaleString()}` },
  { icon: TrendingUp, label: 'This Week', key: 'week', color: 'text-purple-400', bg: 'bg-purple-500/10', formatter: (v: number) => `\u20A6${v.toLocaleString()}` },
]

const quickActions = [
  { icon: Settings, label: 'Manage Services', href: '/provider/services', color: 'text-cyan-400' },
  { icon: Calendar, label: 'View Bookings', href: '/provider/bookings', color: 'text-blue-400' },
  { icon: Globe, label: 'Website Builder', href: '/provider/website', color: 'text-violet-400' },
  { icon: Wallet, label: 'Check Finance', href: '/provider/finance', color: 'text-emerald-400' },
]

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className ?? ''}`} />
}

function StatCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  )
}

export default function ProviderToday() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ bookings: 0, clients: 0, revenue: 0, week: 0 })
  const [activity, setActivity] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<number[]>([])
  const [websiteSlug, setWebsiteSlug] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [hasProducts, setHasProducts] = useState(false)

  const fetchWebsiteSlug = () => {
    const currentUser = storage.getUser()
    if (!currentUser?.id) return
    fetch(`/api/mini-websites?user_id=${currentUser.id}`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.slug) setWebsiteSlug(data.slug)
      })
      .catch(() => {})
  }

  const fetchProducts = () => {
    fetch('/api/provider/products', { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products && data.products.length > 0) setHasProducts(true)
      })
      .catch(() => {})
  }

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') { router.push('/login'); return }
    setUser(currentUser)

    // Fetch real data from API
    fetch('/api/provider/dashboard', { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.stats) setStats(data.stats)
        if (data?.weeklyData) setWeeklyData(data.weeklyData)
        if (data?.activities) setActivity(data.activities)
      })
      .catch(() => {})

    fetchWebsiteSlug()
    fetchProducts()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchWebsiteSlug()
        fetchProducts()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    setTimeout(() => setLoading(false), 600)
    return () => {
      window.removeEventListener('error', errorHandler)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router])

  if (!user) return null

  const maxWeekValue = Math.max(...weeklyData, 1)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(label)
      toast.success(`${label} link copied!`)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-8" suppressHydrationWarning>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-gray-900 border border-white/10 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user.user_metadata?.full_name || user.fullName || user.name || 'Provider'}</h1>
          <p className="text-white/60 mt-2 max-w-xl">Here&apos;s your business summary for today. You have <span className="text-blue-400 font-semibold">{stats.bookings} booking{stats.bookings !== 1 ? 's' : ''}</span> scheduled and <span className="text-green-400 font-semibold">{stats.clients} active client{stats.clients !== 1 ? 's' : ''}</span> this period.</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.2)' }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 cursor-default transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-white/50">{stat.label}</p>
                  <motion.p
                    key={stats[stat.key as keyof typeof stats]}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold text-white mt-0.5"
                  >
                    {stat.formatter(stats[stat.key as keyof typeof stats])}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Your Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><Link2 className="w-5 h-5 text-cyan-400" /> Your Links</h2>
        <div className="flex flex-wrap gap-3">
          {websiteSlug ? (
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/p/${websiteSlug}`, 'Website')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors text-sm"
            >
              {copiedLink === 'Website' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span className="text-cyan-400">/p/{websiteSlug}</span>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </button>
          ) : (
            <button
              onClick={() => router.push('/provider/website')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-colors text-sm"
            >
              <Globe className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400">Create your website</span>
            </button>
          )}
          {hasProducts && (
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/provider/products`, 'Products')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors text-sm"
            >
              {copiedLink === 'Products' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
              <span className="text-orange-400">Products page</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick Actions + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-blue-400" /> Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <motion.button
                key={action.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(action.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              >
                <action.icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs text-white/70 text-center">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-purple-400" /> Quick Stats</h2>
          <div className="flex items-end justify-between gap-2 h-40 pt-2">
            {weeklyData.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / maxWeekValue) * 100}%` }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 60 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-purple-500 relative group"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    \u20A6{val.toLocaleString()}
                  </div>
                </motion.div>
                <span className="text-[10px] text-white/40">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-3 text-center">This week&apos;s revenue breakdown</p>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-emerald-400" /> Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No recent activity</p>
              <p className="text-white/30 text-xs mt-1">Activity will appear as you receive bookings and payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activity.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`p-1.5 rounded-full mt-0.5 ${
                      item.type === 'booking' ? 'bg-blue-500/20 text-blue-400' :
                      item.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                      item.type === 'cancel' ? 'bg-red-500/20 text-red-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {item.type === 'booking' ? <CalendarCheck className="w-3 h-3" /> :
                       item.type === 'payment' ? <DollarSign className="w-3 h-3" /> :
                       item.type === 'review' ? <ArrowUpRight className="w-3 h-3" /> :
                       <Activity className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{item.text}</p>
                      <p className="text-xs text-white/40">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Business Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Business Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: 'Products', href: '/provider/products', color: 'text-orange-400' },
            { icon: ShoppingBag, label: 'Inventory', href: '/provider/inventory', color: 'text-yellow-400' },
            { icon: Building2, label: 'Hotel', href: '/provider/hotel', color: 'text-rose-400' },
            { icon: Music, label: 'Music', href: '/provider/music', color: 'text-pink-400' },
          ].map((tool) => (
            <motion.button
              key={tool.href}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(tool.href)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              <tool.icon className={`w-5 h-5 ${tool.color}`} />
              <span className="text-sm text-white/80">{tool.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
