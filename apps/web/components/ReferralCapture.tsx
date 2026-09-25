'use client'

import { useEffect } from 'react'

/**
 * Captures referral codes from any page URL (?ref=CODE) and persists them
 * for 30 days so the signup flow can attribute the sign-up. Renders nothing.
 */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      if (ref && /^[A-Za-z0-9_-]{2,40}$/.test(ref)) {
        localStorage.setItem(
          'bixfind_referral',
          JSON.stringify({ code: ref, at: Date.now() })
        )
        // Clean the URL so shared links look tidy
        params.delete('ref')
        const qs = params.toString()
        window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
      }
      // Expire stale codes (> 30 days)
      const raw = localStorage.getItem('bixfind_referral')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (!parsed?.at || Date.now() - parsed.at > 30 * 24 * 3600 * 1000) {
            localStorage.removeItem('bixfind_referral')
          }
        } catch {
          localStorage.removeItem('bixfind_referral')
        }
      }
    } catch {}
  }, [])

  return null
}
