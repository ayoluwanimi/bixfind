'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: 'message' | 'verification' | 'trust_badge' | 'order' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  refresh: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function mapDbNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type === 'MESSAGE' ? 'message' : n.type === 'BOOKING_NEW' || n.type === 'BOOKING_UPDATE' ? 'order' : 'system',
    title: n.title,
    message: n.body ?? '',
    read: n.is_read ?? false,
    createdAt: n.created_at,
    data: n.metadata,
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const notificationsRef = useRef<Notification[]>(notifications)
  notificationsRef.current = notifications

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted && session?.user?.id) {
          setUserId(session.user.id)
        }
      } catch (e) {
        console.warn('[Notifications] Failed to get session:', e)
      } finally {
        if (mounted) setReady(true)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!ready) return
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
        setNotifications([])
      }
    })
    return () => subscription.unsubscribe()
  }, [ready])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (!res.ok) return
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications.map(mapDbNotification))
      } else if (Array.isArray(data)) {
        setNotifications(data.map(mapDbNotification))
      }
    } catch {}
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [userId, fetchNotifications])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = mapDbNotification(payload.new)
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          const updated = mapDbNotification(payload.new)
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? updated : n)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })
    } catch {}
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) })
    } catch {}
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
      refresh: () => {},
    }
  }
  return context
}
