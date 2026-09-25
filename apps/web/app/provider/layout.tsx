'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppShell, type AvatarDropdownUser, type Conversation, type Notification } from '@bixfind/ui'
import { useNotifications } from '@/context/NotificationContext'
import { useChat } from '@/context/ChatContext'
import { SearchBar } from '@bixfind/ui'
import { storage } from '@/lib/storage'

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { chats, unreadCount: chatUnread } = useChat()
  const [hydrated, setHydrated] = useState(false)

  const onNavigate = useCallback((href: string) => router.push(href), [router])
  const onLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    storage.clearUser()
    storage.clearToken()
    router.push('/')
  }, [router])

  const handleSearch = useCallback((value: string) => {
    if (value.trim()) router.push(`/search?q=${encodeURIComponent(value.trim())}`)
  }, [router])

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      const user = storage.getUser()
      const token = storage.getToken()
      if (!user || !token) router.push('/login')
    }
  }, [hydrated, router])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen bg-gray-950 items-center justify-center">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    )
  }

  const user = storage.getUser()
  const token = storage.getToken()
  if (!user || !token) return null

  const currentUser: AvatarDropdownUser = {
    id: user.id || '1',
    name: user.user_metadata?.full_name || user.fullName || user.name || 'Provider',
    email: user.email || '',
    role: 'provider',
    avatar: user.avatar,
  }

  const conversations: Conversation[] = chats.map(c => ({
    id: c.participantId,
    participantId: c.participantId,
    participantName: c.participantName,
    participantAvatar: c.participantAvatar,
    lastMessage: c.lastMessage,
    lastMessageTime: c.lastMessageTime,
    unreadCount: c.unreadCount,
  }))

  const mappedNotifications: Notification[] = notifications.map(n => ({
    id: n.id,
    type: (n.type === 'message' ? 'MESSAGE' : n.type === 'order' ? 'BOOKING_NEW' : n.type === 'system' ? 'SYSTEM' : 'SYSTEM') as Notification['type'],
    title: n.title,
    body: n.message,
    time: new Date(n.createdAt).toLocaleDateString(),
    read: n.read,
  }))

  return (
    <AppShell
      user={currentUser}
      searchSlot={<SearchBar onSearch={handleSearch} size="sm" placeholder="Search..." />}
      showSearch
      showSidebar
      sidebarProps={{
        role: 'provider',
        currentPath: pathname,
        onNavigate,
      }}
      notifications={mappedNotifications}
      notificationUnread={unreadCount}
      onNotificationMarkRead={(id) => markAsRead(id)}
      onNotificationMarkAllRead={markAllAsRead}
      onNotificationSeeAll={() => router.push('/notifications')}
      conversations={conversations}
      chatUnread={chatUnread}
      onConversationClick={(conv) => router.push(`/chat/${conv.participantId}`)}
      onChatSeeAll={() => router.push('/chat')}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </AppShell>
  )
}
