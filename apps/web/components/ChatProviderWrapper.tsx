'use client'

import { useState, useEffect } from 'react'
import { ChatProvider } from '@/context/ChatContext'
import { storage } from '@/lib/storage'

export function ChatProviderWrapper({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = storage.getUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  return (
    <ChatProvider currentUser={currentUser}>
      {children}
    </ChatProvider>
  )
}