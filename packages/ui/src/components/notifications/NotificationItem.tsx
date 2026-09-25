"use client"

import { cn } from "../../lib/utils"
import {
  Bell,
  MessageSquare,
  Star,
  DollarSign,
  Package,
  Info,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import type { AppNotification, NotificationType } from "@bixfind/core"

export interface NotificationItemProps {
  notification: AppNotification
  onMarkRead?: (id: string) => void
  onClick?: (notification: AppNotification) => void
  className?: string
}

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  BOOKING_NEW: Bell,
  BOOKING_UPDATE: RefreshCw,
  MESSAGE: MessageSquare,
  REVIEW: Star,
  PAYOUT: DollarSign,
  LOW_STOCK: Package,
  SYSTEM: Info,
}

const TYPE_COLORS: Record<NotificationType, string> = {
  BOOKING_NEW: "text-blue-400",
  BOOKING_UPDATE: "text-cyan-400",
  MESSAGE: "text-green-400",
  REVIEW: "text-yellow-400",
  PAYOUT: "text-emerald-400",
  LOW_STOCK: "text-red-400",
  SYSTEM: "text-purple-400",
}

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return ""
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
  className,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type] || Info
  const colorClass = TYPE_COLORS[notification.type] || "text-white/50"
  const isRead = !!notification.read_at

  const handleClick = () => {
    if (onMarkRead && !isRead) onMarkRead(notification.id)
    if (onClick) onClick(notification)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0",
        !isRead && "bg-white/5",
        className,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", colorClass)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm truncate",
              !isRead ? "text-white font-medium" : "text-white/70",
            )}
          >
            {notification.title}
          </p>
          {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
        </div>
        {notification.body && (
          <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{notification.body}</p>
        )}
        <p className="text-[10px] text-white/30 mt-1">{formatTime(notification.created_at)}</p>
      </div>
    </button>
  )
}
