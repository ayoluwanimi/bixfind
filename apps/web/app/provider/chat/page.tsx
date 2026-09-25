'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationList, ChatThread } from '@bixfind/ui'
import { useConversations, useConversation, useSendMessage, useMarkAsRead } from '@bixfind/core'
import { storage } from '@/lib/storage'
import { useChatRealtime } from '@/lib/useChatRealtime'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProviderChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') { router.push('/login'); return }
    setUser(currentUser)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const userId = user?.id
  const { data: conversations, isLoading: convsLoading } = useConversations(userId)
  const { conversation, messages } = useConversation(activeId ?? undefined)
  const { sendMessage, isPending } = useSendMessage(activeId ?? undefined)
  const { markAsRead } = useMarkAsRead(activeId ?? undefined)

  useChatRealtime(activeId ?? undefined)

  const handleSelect = (conv: any) => {
    setActiveId(conv.id)
    markAsRead()
  }

  const handleSend = (body: string, attachments?: any[]) => {
    sendMessage(body, attachments)
  }

  if (!user) return null

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950" suppressHydrationWarning>
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations ?? []}
            activeId={activeId ?? undefined}
            onSelect={handleSelect}
            isLoading={convsLoading}
          />
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {activeId ? (
          <>
            <div className="md:hidden px-4 py-3 border-b border-white/10">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActiveId(null)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </motion.button>
            </div>
            <ChatThread
              messages={messages.data ?? []}
              currentUserId={userId}
              conversationName={conversation.data?.customer?.full_name ?? 'Customer'}
              onSend={handleSend}
              isSending={isPending}
              isLoading={messages.isLoading}
              className="flex-1"
            />
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
