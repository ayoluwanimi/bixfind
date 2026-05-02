'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storage } from '@/lib/storage'

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const saved = storage.get('notifications') || []
    setNotifications(saved)
  }, [])

  const saveNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications)
    storage.set('notifications', newNotifications)
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false
    }
    saveNotifications([newNotification, ...notifications])
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
  }

  const clearNotifications = () => {
    saveNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
