'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { useNotifications } from '@/context/NotificationContext'
import { storage } from '@/lib/storage'

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = storage.getUser()
    if (savedUser) {
      setUser(savedUser)
    }
  }, [])

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notif.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t flex gap-2">
              <button
                onClick={markAllAsRead}
                className="flex-1 text-xs text-blue-600 hover:bg-blue-50 py-2 rounded"
              >
                Mark all read
              </button>
              <button
                onClick={clearNotifications}
                className="flex-1 text-xs text-red-600 hover:bg-red-50 py-2 rounded"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
