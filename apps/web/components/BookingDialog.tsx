'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BookingDialog({
  serviceId,
  serviceTitle,
  providerName,
  price,
  currency = 'NGN',
  onClose,
}: {
  serviceId: string
  serviceTitle: string
  providerName: string
  price: number
  currency?: string
  onClose: () => void
}) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)

  const minDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  const submit = async () => {
    if (!date) { setError('Pick a date and time'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, scheduledDate: new Date(date).toISOString(), notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        // Not signed in — send them to login, remember nothing sensitive.
        router.push('/login')
        return
      }
      if (!res.ok) {
        setError(data.error || 'Could not create booking')
        return
      }
      setCreated(true)
      setTimeout(() => {
        onClose()
        router.push('/bookings')
      }, 1200)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : ''

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          {created ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking created!</h3>
              <p className="text-gray-500">Taking you to your bookings…</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Book &quot;{serviceTitle}&quot;</h3>
                  <p className="text-gray-500 text-sm">with {providerName}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-2xl font-bold text-blue-600 mb-6">
                {symbol}
                {Number(price).toLocaleString()}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />When
              </label>
              <input
                type="datetime-local"
                value={date}
                min={minDate}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Anything the provider should know"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && (
                <p className="text-sm text-red-600 mb-3">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Creating…' : 'Confirm booking'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                No payment now — payment happens through secure escrow after the provider confirms.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
