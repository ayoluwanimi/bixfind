import { toast } from 'sonner'
import { realtimeDb } from './realtime'
import { storage } from './storage'

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false
  
  if (!('Notification' in window)) {
    toast.error('This browser does not support notifications')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      toast.success('Notifications enabled!')
      return true
    }
  }
  
  if (Notification.permission === 'denied') {
    toast.error('Notifications blocked. Please enable them in browser settings.')
  }
  
  return false
}

export const showBrowserNotification = (title: string, options?: NotificationOptions): void => {
  if (typeof window === 'undefined') return
  
  if (!('Notification' in window)) {
    return
  }
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    })
  }
}

export const notifyUser = (title: string, body?: string, icon?: string): void => {
  showBrowserNotification(title, {
    body,
    icon: icon || '/logo.png'
  })
}

export const subscribeToUserNotifications = () => {
  if (typeof window === 'undefined') return () => {}
  
  const user = storage.getUser()
  if (!user || !user.id) return () => {}
  
  if (Notification.permission !== 'granted') {
    return () => {}
  }
  
  return realtimeDb.subscribeToNotifications(user.id, (data) => {
    if (data) {
      const notifications = Object.values(data)
      if (notifications.length > 0) {
        const latest = notifications[notifications.length - 1] as any
        if (latest && !latest.read) {
          notifyUser(
            latest.title || 'New Notification',
            latest.message || latest.body || '',
            latest.icon
          )
        }
      }
    }
  })
}
