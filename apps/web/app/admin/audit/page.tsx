'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { History, RefreshCw, Filter, Search, Trash2, Clock, User, Shield, Info, Star, Ban, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { storage } from '@/lib/storage'
import { auditLogger } from '@/lib/security'
import type { AuditLog } from '@/lib/security'

const ACTION_ICONS: Record<string, React.ElementType> = {
  feature: Star,
  unfeature: Star,
  suspend: Ban,
  unsuspend: CheckCircle2,
  login: User,
  logout: User,
  delete: XCircle,
  update: Info,
  create: CheckCircle2,
}

const ACTION_COLORS: Record<string, string> = {
  feature: 'text-yellow-400 bg-yellow-500/10',
  unfeature: 'text-gray-400 bg-gray-500/10',
  suspend: 'text-red-400 bg-red-500/10',
  unsuspend: 'text-green-400 bg-green-500/10',
  login: 'text-blue-400 bg-blue-500/10',
  logout: 'text-blue-400 bg-blue-500/10',
  delete: 'text-red-400 bg-red-500/10',
  update: 'text-cyan-400 bg-cyan-500/10',
  create: 'text-green-400 bg-green-500/10',
}

export default function AdminAuditPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [clearing, setClearing] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval>>()

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

    loadLogs()

    const unsub = auditLogger.subscribe((log) => {
      if (log) setLogs(prev => [log, ...prev])
      else setLogs([])
    })

    return () => {
      window.removeEventListener('error', errorHandler)
      unsub()
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [router])

  useEffect(() => {
    if (autoRefresh) {
      pollingRef.current = setInterval(loadLogs, 5000)
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [autoRefresh])

  useEffect(() => {
    let result = logs
    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.userName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      )
    }
    setFilteredLogs(result)
  }, [logs, search, actionFilter])

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs?limit=200')
      if (res.ok) {
        const json = await res.json()
        if (json.data !== undefined) {
          const mapped = json.data.map((l: any) => ({
            action: l.action,
            userId: l.profile_id || l.metadata?.userIdentifier || '',
            userName: l.metadata?.userName || l.metadata?.userIdentifier || '',
            details: l.new_values?.details || l.action,
            timestamp: new Date(l.created_at).getTime(),
            ipAddress: l.ip_address,
            userAgent: l.user_agent,
          }))
          setLogs(mapped)
          return
        }
      }
    } catch {}
    const all = auditLogger.getLogs()
    setLogs(all.reverse())
  }

  const handleClear = () => {
    setClearing(true)
    auditLogger.clearLogs()
    setLogs([])
    setTimeout(() => setClearing(false), 500)
  }

  const uniqueActions = [...new Set(logs.map(l => l.action))]

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-white/60 mt-1">Real-time platform activity tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAutoRefresh(!autoRefresh); if (!autoRefresh) loadLogs() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${autoRefresh ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>
          <button onClick={loadLogs} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button onClick={handleClear} disabled={clearing} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50">
            {clearing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Clear
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
            placeholder="Search by user, action, or details..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-white/30 whitespace-nowrap">
          {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <History className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/40 text-sm">No audit logs yet</p>
            <p className="text-white/20 text-xs mt-1">Activity will appear here as actions are taken</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map((log, i) => {
              const Icon = ACTION_ICONS[log.action] || Shield
              const color = ACTION_COLORS[log.action] || 'text-white/40 bg-white/5'
              return (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white capitalize">{log.action}</span>
                      <span className="text-xs text-white/40">by</span>
                      <span className="text-sm text-blue-400">{log.userName}</span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{log.details}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-white/30 flex items-center gap-1 min-w-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.ipAddress && log.ipAddress !== '0.0.0.0' && (
                        <span className="text-xs text-white/20 font-mono truncate">IP: {log.ipAddress}</span>
                      )}
                      {log.userId && (
                        <span className="text-xs text-white/20 font-mono truncate">ID: {log.userId.substring(0, 12)}...</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          Logs are persisted to the database and survive deployments. IP addresses captured server-side.
          Auto-refresh every 5 seconds.
        </div>
      </div>
    </div>
  )
}
