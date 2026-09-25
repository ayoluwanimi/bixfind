'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarCheck, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, User, CalendarDays, Tag, DollarSign } from 'lucide-react'
import { storage } from '@/lib/storage'

type BookingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled'

interface Booking {
  id: string
  customerName: string
  service: string
  date: string
  time: string
  amount: number
  status: BookingStatus
}

const tabs: { key: BookingStatus; label: string; icon: typeof CalendarCheck }[] = [
  { key: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
  { key: 'in_progress', label: 'In Progress', icon: Clock },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
]

const statusStyles: Record<BookingStatus, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const statusLabels: Record<BookingStatus, string> = {
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-white/60 mt-2 text-sm">{message}</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">Confirm</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function BookingSkeleton() {
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
        <div className="h-3 bg-white/10 rounded w-16" />
        <div className="h-3 bg-white/10 rounded w-24" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-white/10 rounded-xl flex-1" />
        <div className="h-8 bg-white/10 rounded-xl flex-1" />
      </div>
    </div>
  )
}

export default function ProviderBookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [confirmDialog, setConfirmDialog] = useState<{ booking: Booking; action: BookingStatus } | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [showCalendar, setShowCalendar] = useState(false)

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

    const saved = storage.get('provider_bookings')
    if (saved && saved.length > 0) {
      setBookings(saved)
    }

    setTimeout(() => setLoading(false), 400)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const updateBookingStatus = useCallback((bookingId: string, newStatus: BookingStatus) => {
    const updated = bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    setBookings(updated)
    storage.set('provider_bookings', updated)
    setConfirmDialog(null)
  }, [bookings])

  const filteredBookings = bookings.filter(b => b.status === activeTab)
  const upcomingDates = bookings.filter(b => b.status === 'upcoming').map(b => b.date)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay()

  const prevMonth = () => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) } else { setCalendarMonth(m => m - 1) } }
  const nextMonth = () => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) } else { setCalendarMonth(m => m + 1) } }

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog ? `Mark as ${statusLabels[confirmDialog.action]}` : ''}
        message={confirmDialog ? `Are you sure you want to move ${confirmDialog.booking.customerName}'s booking for ${confirmDialog.booking.service} to "${statusLabels[confirmDialog.action]}"?` : ''}
        onConfirm={() => confirmDialog && updateBookingStatus(confirmDialog.booking.id, confirmDialog.action)}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-white/50 mt-1">Manage your customer bookings</p>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors text-sm"
        >
          <CalendarDays className="w-4 h-4" />
          {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
        </button>
      </motion.div>

      {/* Calendar */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <h3 className="text-white font-semibold">{monthNames[calendarMonth]} {calendarYear}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-xs text-white/40 py-1">{d}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = (i + 1).toString().padStart(2, '0')
                  const dateStr = `${calendarYear}-${(calendarMonth + 1).toString().padStart(2, '0')}-${day}`
                  const hasBooking = upcomingDates.includes(dateStr)
                  const isToday = new Date().toISOString().slice(0, 10) === dateStr
                  return (
                    <div
                      key={i}
                      className={`relative p-2 rounded-lg text-sm transition-colors ${
                        isToday ? 'bg-blue-600/30 text-blue-300 font-bold' : hasBooking ? 'bg-green-500/20 text-green-300' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {i + 1}
                      {hasBooking && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
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
            <span className="ml-1 text-xs opacity-60">({bookings.filter(b => b.status === tab.key).length})</span>
          </motion.button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <BookingSkeleton key={i} />)
        ) : filteredBookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
            <CalendarCheck className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60 mb-1">No {activeTab.replace('_', ' ')} bookings</h3>
            <p className="text-white/40 text-sm">
              {activeTab === 'upcoming' ? 'When customers book your services, they\'ll appear here.' :
               activeTab === 'in_progress' ? 'Start an upcoming booking to track it here.' :
               activeTab === 'completed' ? 'Completed bookings will show up here.' :
               'No cancelled bookings to show.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
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
                      <h3 className="text-white font-semibold truncate">{booking.customerName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/50">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {booking.service}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.time}</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-400"><DollarSign className="w-3.5 h-3.5" /> \u20A6{booking.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {booking.status === 'upcoming' && (
                      <>
                        <button onClick={() => setConfirmDialog({ booking, action: 'in_progress' })} className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-colors">Start</button>
                        <button onClick={() => setConfirmDialog({ booking, action: 'cancelled' })} className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors">Cancel</button>
                      </>
                    )}
                    {booking.status === 'in_progress' && (
                      <button onClick={() => setConfirmDialog({ booking, action: 'completed' })} className="px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors">Complete</button>
                    )}
                    {booking.status === 'completed' && (
                      <span className="px-3 py-1.5 text-xs text-white/30">Done</span>
                    )}
                    {booking.status === 'cancelled' && (
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
