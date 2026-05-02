'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storage } from '@/lib/storage'

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, currentUser }: { children: ReactNode; currentUser?: any }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)

  useEffect(() => {
    const saved = storage.get('chats') || []
    setChats(saved)
  }, [])

  const saveChats = (newChats: Chat[]) => {
    setChats(newChats)
    storage.set('chats', newChats)
  }

  const startChat = (providerId: string, providerName: string, providerAvatar?: string) => {
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
    saveChats([...chats, newChat])
    setActiveChat(newChat)
  }

  const sendMessage = (content: string) => {
    if (!activeChat) return

    const userId = currentUser?.id || 'guest_user'
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
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
    setActiveChat(updatedChats.find(c => c.participantId === activeChat.participantId) || null)
  }

  const markChatAsRead = (participantId: string) => {
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
  }

  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)

  return (
    <ChatContext.Provider value={{
      chats,
      activeChat,
      unreadCount,
      startChat,
      sendMessage,
      setActiveChat,
      markChatAsRead
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
