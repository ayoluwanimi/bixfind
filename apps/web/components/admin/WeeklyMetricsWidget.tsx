'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Globe, Star, CalendarCheck, Copy, Check, RefreshCw } from 'lucide-react'

interface WeeklyData {
  weekOf: string
  websites: { published: number; drafts: number; newThisWeek: number }
  providers: { total: number }
  engagement: { reviewsThisWeek: number; bookingsThisWeek: number }
}

/**
 * Weekly growth widget for the admin overview.
 * Data comes from /api/metrics/weekly (real counts; missing tables report 0).
 * Includes a referral-link builder that produces ?ref= codes captured at signup.
 */
export default function WeeklyMetricsWidget() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refCode, setRefCode] = useState('')
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/metrics/weekly')
      if (!res.ok) throw new Error('Could not load metrics')
      setData(await res.json())
    } catch {
      setError('Metrics unavailable right now')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const copyRef = async () => {
    const code = refCode.trim().replace(/[^A-Za-z0-9_-]/g, '')
    if (!code) return
    try {
      await navigator.clipboard.writeText(`https://bixfind.indevs.in/?ref=${encodeURIComponent(code)}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const cards = data
    ? [
        { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Published sites', value: data.websites.published, sub: `${data.websites.drafts} in draft` },
        { icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'New sites this week', value: data.websites.newThisWeek, sub: 'builder signups' },
        { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Reviews this week', value: data.engagement.reviewsThisWeek, sub: 'trust signals' },
        { icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Bookings this week', value: data.engagement.bookingsThisWeek, sub: 'platform activity' },
      ]
    : []

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Growth (this week)
        </h2>
        <button
          onClick={load}
          className="text-white/40 hover:text-white transition p-1"
          aria-label="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-white/40">{error}</p>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                  <c.icon className={`w-4.5 h-4.5 ${c.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{c.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Referral link builder */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">
              Referral links — share <span className="text-white/80">?ref=CODE</span> links; the code is stored with the signup
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="e.g. instagram-oct or nysc-lagos"
                maxLength={40}
                className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={copyRef}
                disabled={!refCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
