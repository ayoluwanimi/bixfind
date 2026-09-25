'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'

const INACTIVITY_TIMEOUT = 10 * 60 * 1000
const WARNING_BEFORE = 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'click', 'keydown', 'scroll', 'touchstart', 'wheel']

export default function InactivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (warningRef.current) { clearTimeout(warningRef.current); warningRef.current = null }
  }, [])

  const logout = useCallback(() => {
    const user = storage.getUser()
    if (!user) return
    storage.clearUser()
    storage.clearToken()
    toast.error('Logged out due to inactivity')
    router.push('/login')
  }, [router])

  const resetTimer = useCallback(() => {
    clearTimers()

    const user = storage.getUser()
    if (!user) return

    warningRef.current = setTimeout(() => {
      if (storage.getUser()) {
        toast.warning('Your session will expire in 1 minute due to inactivity', { duration: 8000 })
      }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT)
  }, [clearTimers, logout])

  useEffect(() => {
    if (!storage.getUser()) return

    resetTimer()

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [resetTimer, clearTimers])

  return <>{children}</>
}
