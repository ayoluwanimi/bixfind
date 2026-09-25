'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, X, Check, Filter, AlertTriangle } from 'lucide-react'
import { storage } from '@/lib/storage'

const statusFilters = ['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled']

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const user = storage.getUser()
    if (!user) { router.push('/login'); return }
    setBookings(storage.get('user_bookings') || [])
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const handleCancel = () => {
    if (!cancelId) return
    const updated = bookings.map(b =>
      b.id === cancelId ? { ...b, status: 'cancelled' } : b
    )
    setBookings(updated)
    storage.set('user_bookings', updated)
    setCancelId(null)
    showToast('Booking cancelled')
  }

  const filtered = activeFilter === 'All'
    ? bookings
    : bookings.filter(b => {
        const label = b.status === 'in-progress' ? 'In Progress' : b.status.charAt(0).toUpperCase() + b.status.slice(1)
        return label === activeFilter
      })

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      upcoming: { color: 'bg-blue-500/20 text-blue-400', label: 'Upcoming' },
      'in-progress': { color: 'bg-yellow-500/20 text-yellow-400', label: 'In Progress' },
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
      cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
    }
    const m = map[status] || { color: 'bg-gray-500/20 text-gray-400', label: status }
    return <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${m.color}`}>{m.label}</span>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" suppressHydrationWarning>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-white/60 mt-1">View and manage your service bookings</p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-white/10 pb-4">
          {statusFilters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === f ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'All' ? <Filter className="w-4 h-4 inline mr-1" /> : null}
              {f}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4 mt-6">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/5 border border-white/10 rounded-xl"
            >
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-xl font-bold">No {activeFilter.toLowerCase()} bookings</p>
              <p className="text-white/60 mt-2">Discover services and book your first appointment</p>
              <Link href="/search" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
                Browse Services
              </Link>
            </motion.div>
          ) : (
            filtered.map((booking, i) => (
              <motion.div
                key={booking.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {booking.service.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{booking.service}</h3>
                        <p className="text-white/60 text-sm">{booking.provider}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(booking.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.location}
                      </span>
                    </div>
                    {booking.notes && (
                      <p className="text-sm text-white/30 mt-2 italic">"{booking.notes}"</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold">&#x20A6;{booking.amount.toLocaleString()}</p>
                    {statusBadge(booking.status)}
                    {booking.status === 'upcoming' && (
                      <button
                        onClick={() => setCancelId(booking.id)}
                        className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setCancelId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-center mb-2">Cancel Booking?</h3>
              <p className="text-white/60 text-center mb-6">This will cancel your booking. Refund terms apply.</p>
              <div className="flex gap-3">
                <button onClick={() => setCancelId(null)} className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition">Keep It</button>
                <button onClick={handleCancel} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
