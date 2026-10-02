'use client'

import { useState } from 'react'
import { Star, X, Loader2 } from 'lucide-react'

/**
 * Star-rating dialog that POSTs to /api/reviews.
 * Review identity/eligibility is enforced server-side (own completed booking,
 * one per booking) — this form only collects rating + optional text.
 */
export default function ReviewDialog({
  booking,
  onClose,
  onSubmitted,
}: {
  booking: { id: string; providerName?: string; service?: string }
  onClose: () => void
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!rating) {
      setError('Choose a star rating first')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id, rating, title: title || undefined, body: body || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Could not submit review')
      }
      onSubmitted()
    } catch (e: any) {
      setError(e?.message || 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Rate your experience</h3>
            {booking.providerName && (
              <p className="text-sm text-white/50 mt-0.5">
                {booking.service ? `${booking.service} with ` : ''}{booking.providerName}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 mb-4" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star className={`w-8 h-8 transition-colors ${n <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
            </button>
          ))}
        </div>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={120}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 mb-2"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="How did it go? (optional)"
          maxLength={2000}
          rows={3}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 mb-4 resize-none"
        />

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit review
        </button>
      </div>
    </div>
  )
}
