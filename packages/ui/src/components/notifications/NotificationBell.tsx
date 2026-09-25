"use client"

import { cn } from "../../lib/utils"
import { Bell } from "lucide-react"

export interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
  className?: string
  iconSize?: number
}

export function NotificationBell({
  unreadCount,
  onClick,
  className,
  iconSize = 20,
}: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors",
        className,
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell size={iconSize} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
