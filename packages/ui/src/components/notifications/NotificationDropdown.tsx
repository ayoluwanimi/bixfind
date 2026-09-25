"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Check, ChevronRight, X, MessageSquare, Star, DollarSign, AlertTriangle, Package, Info, CheckCheck } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface Notification {
  id: string
  type: "BOOKING_NEW" | "MESSAGE" | "REVIEW" | "PAYOUT" | "SYSTEM" | "LOW_STOCK"
  title: string
  body: string
  time: string
  read: boolean
  link?: string
}

export interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onSeeAll?: () => void
  className?: string
  iconSize?: number
}

const TYPE_ICONS: Record<Notification["type"], typeof Bell> = {
  BOOKING_NEW: Bell,
  MESSAGE: MessageSquare,
  REVIEW: Star,
  PAYOUT: DollarSign,
  LOW_STOCK: Package,
  SYSTEM: Info,
}

const TYPE_COLORS: Record<Notification["type"], string> = {
  BOOKING_NEW: "text-blue-400",
  MESSAGE: "text-green-400",
  REVIEW: "text-yellow-400",
  PAYOUT: "text-emerald-400",
  LOW_STOCK: "text-red-400",
  SYSTEM: "text-purple-400",
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onSeeAll,
  className,
  iconSize = 20,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell size={40} className="text-white/20 mb-3" />
                  <p className="text-sm text-white/40">No notifications yet</p>
                  <p className="text-xs text-white/20 mt-1">We'll let you know when something arrives</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Info
                  const colorClass = TYPE_COLORS[notif.type] || "text-white/50"
                  return (
                    <button
                      key={notif.id}
                      onClick={() => { onMarkAsRead(notif.id); notif.link && (window.location.href = notif.link) }}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0",
                        !notif.read && "bg-white/5"
                      )}
                    >
                      <div className={cn("mt-0.5 shrink-0", colorClass)}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm truncate", !notif.read ? "text-white font-medium" : "text-white/70")}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{notif.body}</p>
                        <p className="text-[10px] text-white/30 mt-1">{notif.time}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-white/10 p-2">
                {onSeeAll && (
                  <button
                    onClick={onSeeAll}
                    className="flex items-center justify-center gap-1 w-full py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    See all notifications
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
