'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { storage } from '@/lib/storage'
import { realtimeDb } from '@/lib/supabase'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
}

interface Chat {
  participantId: string
  participantName: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

interface ChatContextType {
  chats: Chat[]
  activeChat: Chat | null
  unreadCount: number
  startChat: (providerId: string, providerName: string, providerAvatar?: string) => void
  sendMessage: (content: string) => void
  setActiveChat: (chat: Chat | null) => void
  markChatAsRead: (participantId: string) => void
  refreshChats: () => Promise<void>
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, currentUser }: { children: ReactNode; currentUser?: any }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)

  useEffect(() => {
    const init = async () => {
      const saved = storage.get('chats') || []
      setChats(saved)
      setIsLoading(false)
    }
    init()
  }, [])

  const loadChatsFromSupabase = async (userId: string) => {
    try {
      const data = await realtimeDb.get(`chats/${userId}`)
      if (data && Array.isArray(data)) {
        const localChats = storage.get('chats') || []
        const mergedChats = mergeChats(localChats, data)
        setChats(mergedChats)
        storage.set('chats', mergedChats)
        setIsSupabaseConnected(true)
      }
    } catch (e) {
      console.warn('Could not load chats from Supabase:', e)
    }
  }

  const mergeChats = (localChats: Chat[], remoteChats: Chat[]): Chat[] => {
    const chatMap = new Map<string, Chat>()
    
    localChats.forEach(chat => {
      chatMap.set(chat.participantId, chat)
    })
    
    remoteChats.forEach(chat => {
      const existing = chatMap.get(chat.participantId)
      if (existing) {
        const mergedMessages = [...existing.messages]
        chat.messages.forEach(msg => {
          if (!mergedMessages.find(m => m.id === msg.id)) {
            mergedMessages.push(msg)
          }
        })
        mergedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        chatMap.set(chat.participantId, { ...existing, messages: mergedMessages })
      } else {
        chatMap.set(chat.participantId, chat)
      }
    })
    
    return Array.from(chatMap.values())
  }

  const saveChats = (newChats: Chat[]) => {
    setChats(newChats)
    storage.set('chats', newChats)
    
    if (currentUser?.id && isSupabaseConnected) {
      realtimeDb.set(`chats/${currentUser.id}`, newChats).catch(() => {})
    }
  }

  const startChat = useCallback((providerId: string, providerName: string, providerAvatar?: string) => {
    const existingChat = chats.find(c => c.participantId === providerId)
    if (existingChat) {
      setActiveChat(existingChat)
      return
    }

    const newChat: Chat = {
      participantId: providerId,
      participantName: providerName,
      participantAvatar: providerAvatar || undefined,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: []
    }
    const updatedChats = [...chats, newChat]
    saveChats(updatedChats)
    setActiveChat(newChat)
  }, [chats])

  const sendMessage = useCallback((content: string) => {
    if (!activeChat) return

    const userId = currentUser?.id || 'guest_user'
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: userId,
      receiverId: activeChat.participantId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    }

    const updatedChats = chats.map(chat => {
      if (chat.participantId === activeChat.participantId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: content,
          lastMessageTime: newMessage.timestamp
        }
      }
      return chat
    })

    saveChats(updatedChats)
    const updatedActiveChat = updatedChats.find(c => c.participantId === activeChat.participantId) || null
    setActiveChat(updatedActiveChat)

    if (isSupabaseConnected && currentUser?.id) {
      realtimeDb.push(`messages/${currentUser.id}/${activeChat.participantId}`, newMessage).catch(() => {})
      
      realtimeDb.push(`notifications/${activeChat.participantId}`, {
        type: 'chat',
        title: 'New Message',
        message: content.substring(0, 100),
        senderId: userId,
        senderName: currentUser.fullName || currentUser.displayName || 'Someone',
        timestamp: Date.now()
      }).catch(() => {})
    }
  }, [activeChat, chats, currentUser, isSupabaseConnected])

  const markChatAsRead = useCallback((participantId: string) => {
    const updatedChats = chats.map(chat => {
      if (chat.participantId === participantId) {
        return {
          ...chat,
          unreadCount: 0,
          messages: chat.messages.map(m => ({ ...m, read: true }))
        }
      }
      return chat
    })
    saveChats(updatedChats)
  }, [chats])

  const refreshChats = useCallback(async () => {
    if (!currentUser?.id) return
    setIsLoading(true)
    await loadChatsFromSupabase(currentUser.id)
    setIsLoading(false)
  }, [currentUser?.id])

  useEffect(() => {
    // Legacy Supabase realtime disabled — use the conversation-based chat system instead
  }, [])

  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      unreadCount,
      startChat,
      sendMessage,
      setActiveChat,
      markChatAsRead,
      refreshChats,
      isLoading
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}