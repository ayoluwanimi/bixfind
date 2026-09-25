"use client"

import { useState, useEffect } from "react"
import { cn } from "../../lib/utils"
import { Menu, X } from "lucide-react"
import type { ReactNode } from "react"
import { Sidebar, type SidebarProps } from "../sidebar/Sidebar"
import { AvatarDropdown, type AvatarDropdownUser } from "../avatar/AvatarDropdown"
import { NotificationDropdown, type Notification } from "../notifications/NotificationDropdown"
import { ChatDrawer, type Conversation } from "../chat/ChatDrawer"

export interface AppShellProps {
  children?: ReactNode
  user: AvatarDropdownUser
  logo?: ReactNode
  /** Search bar rendered in the header */
  searchSlot?: ReactNode
  showSearch?: boolean
  showSidebar?: boolean
  sidebarProps?: Omit<SidebarProps, "isMobileOpen" | "onMobileClose">
  /** Notifications */
  notifications?: Notification[]
  notificationUnread?: number
  onNotificationMarkRead?: (id: string) => void
  onNotificationMarkAllRead?: () => void
  onNotificationSeeAll?: () => void
  /** Conversations for chat drawer */
  conversations?: Conversation[]
  chatUnread?: number
  onConversationClick?: (conv: Conversation) => void
  onChatSeeAll?: () => void
  /** User menu */
  onLogout: () => void
  onNavigate: (href: string) => void
  /** Header customization */
  headerClassName?: string
  className?: string
}

export function AppShell({
  children,
  user,
  logo,
  searchSlot,
  showSearch = true,
  showSidebar = true,
  sidebarProps,
  notifications = [],
  notificationUnread = 0,
  onNotificationMarkRead = () => {},
  onNotificationMarkAllRead = () => {},
  onNotificationSeeAll,
  conversations = [],
  chatUnread = 0,
  onConversationClick = () => {},
  onChatSeeAll,
  onLogout,
  onNavigate,
  headerClassName,
  className,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const defaultLogo = (
    <a
      href="/"
      onClick={(e) => { e.preventDefault(); onNavigate("/") }}
      className="flex items-center gap-2 shrink-0"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <span className="text-white font-bold text-xs">B</span>
      </div>
      {!isMobile && <span className="text-lg font-bold text-white">Bixfind</span>}
    </a>
  )

  return (
    <div className={cn("flex min-h-screen bg-gray-950", className)}>
      {/* Sidebar */}
      {showSidebar && sidebarProps && (
        <Sidebar
          {...sidebarProps}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Sticky glassmorphic header */}
        <header
          className={cn(
            "sticky top-0 z-30 w-full border-b border-white/10",
            "bg-gray-900/80 backdrop-blur-xl",
            headerClassName,
          )}
        >
          <div className={cn(
            "flex items-center",
            isMobile ? "h-14 gap-2 px-3" : "h-16 gap-3 px-6"
          )}>
            {/* Mobile hamburger */}
            {showSidebar && isMobile && (
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            {logo || defaultLogo}

            {/* Search bar - compact on mobile, full on desktop */}
            {showSearch && searchSlot && (
              <div className={cn(
                "mx-auto shrink overflow-hidden",
                isMobile ? "w-[96px] min-w-0" : "flex-1 max-w-xl"
              )}>{searchSlot}</div>
            )}

            {/* Spacer when no search */}
            {(!showSearch || !searchSlot) && <div className="flex-1" />}

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">
              <NotificationDropdown
                notifications={notifications}
                unreadCount={notificationUnread}
                onMarkAsRead={onNotificationMarkRead}
                onMarkAllAsRead={onNotificationMarkAllRead}
                onSeeAll={onNotificationSeeAll}
              />
              <ChatDrawer
                conversations={conversations}
                unreadCount={chatUnread}
                onConversationClick={onConversationClick}
                onSeeAll={onChatSeeAll}
              />
              <AvatarDropdown user={user} onNavigate={onNavigate} onLogout={onLogout} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
