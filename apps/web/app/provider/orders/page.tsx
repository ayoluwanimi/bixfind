'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Clock, CheckCircle, XCircle, User, CalendarDays, Tag, DollarSign, ShoppingBag } from 'lucide-react'
import { storage } from '@/lib/storage'

type OrderStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

interface Order {
  id: string
  customerName: string
  service: string
  date: string
  amount: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  description?: string
}

const statusTabs: { key: OrderStatus; label: string; icon: typeof Package }[] = [
  { key: 'all', label: 'All', icon: Package },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: ShoppingBag },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function OrderSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/10 rounded w-24" />
        </div>
        <div className="h-6 bg-white/10 rounded-full w-20" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-white/10 rounded w-20" />
        <div className="h-3 bg-white/10 rounded w-24" />
      </div>
    </div>
  )
}

export default function ProviderOrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus>('all')
  const [orders, setOrders] = useState<Order[]>([])

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

    fetch('/api/provider/dashboard', { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.orders) {
          setOrders(data.orders)
        } else {
          const saved = storage.get('provider_bookings')
          if (Array.isArray(saved) && saved.length > 0) {
            const mapped: Order[] = saved.map((b: any) => ({
              id: b.id,
              customerName: b.customerName,
              service: b.service,
              date: b.date,
              amount: b.amount,
              status: b.status === 'upcoming' ? 'pending' : b.status,
              description: b.description,
            }))
            setOrders(mapped)
          }
        }
      })
      .catch(() => {
        const saved = storage.get('provider_bookings')
        if (Array.isArray(saved) && saved.length > 0) {
          const mapped: Order[] = saved.map((b: any) => ({
            id: b.id,
            customerName: b.customerName,
            service: b.service,
            date: b.date,
            amount: b.amount,
            status: b.status === 'upcoming' ? 'pending' : b.status,
            description: b.description,
          }))
          setOrders(mapped)
        }
      })
      .finally(() => setTimeout(() => setLoading(false), 400))

    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab)

  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const completedCount = orders.filter(o => o.status === 'completed').length

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-white/50 mt-1">Track and manage your customer orders</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: orders.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Package },
          { label: 'Pending', value: pendingCount.toString(), color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
          { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/10', icon: DollarSign },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusTabs.map(tab => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length})</span>
          </motion.button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : filteredOrders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-1">No {activeTab === 'all' ? '' : statusLabels[activeTab]?.toLowerCase() + ' '}orders</h3>
            <p className="text-white/40 text-sm">
              {activeTab === 'all' ? 'When customers place orders, they\'ll appear here.' :
               activeTab === 'pending' ? 'No pending orders at the moment.' :
               activeTab === 'in_progress' ? 'No orders currently in progress.' :
               activeTab === 'completed' ? 'Completed orders will show up here.' :
               'No cancelled orders to show.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-white/40" />
                      <h3 className="text-white font-semibold truncate">{order.customerName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[order.status] || 'bg-white/10 text-white/60'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/50">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {order.service}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(order.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-400"><DollarSign className="w-3.5 h-3.5" /> ₦{order.amount.toLocaleString()}</span>
                    </div>
                    {order.description && <p className="text-xs text-white/40 mt-2 truncate">{order.description}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => {
                          const updated = orders.map(o => o.id === order.id ? { ...o, status: 'in_progress' as const } : o)
                          setOrders(updated)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-colors"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          const updated = orders.map(o => o.id === order.id ? { ...o, status: 'completed' as const } : o)
                          setOrders(updated)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <span className="px-3 py-1.5 text-xs text-white/30">Done</span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="px-3 py-1.5 text-xs text-white/30">Cancelled</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
