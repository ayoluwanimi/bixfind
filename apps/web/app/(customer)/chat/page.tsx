"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ConversationList, ChatThread } from "@bixfind/ui"
import { useConversations, useConversation, useSendMessage, useMarkAsRead } from "@bixfind/core"
import { storage } from "@/lib/storage"
import { useChatRealtime } from "@/lib/useChatRealtime"
import { MessageSquare, ArrowLeft } from "lucide-react"

export default function ChatPage() {
  const router = useRouter()
  const user = storage.getUser()
  const userId = user?.id

  const { data: conversations, isLoading: convsLoading } = useConversations(userId)
  const [activeId, setActiveId] = useState<string | null>(null)

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-white/60">Please sign in to use chat</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950">
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/10 flex flex-col ${activeId ? "hidden md:flex" : "flex"}`}>
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

      <div className={`flex-1 flex flex-col ${!activeId ? "hidden md:flex" : "flex"}`}>
        {activeId ? (
          <>
            <div className="md:hidden px-4 py-3 border-b border-white/10">
              <button
                onClick={() => setActiveId(null)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            </div>
            <ChatThread
              messages={messages.data ?? []}
              currentUserId={userId}
              conversationName={conversation.data?.provider?.business_name ?? conversation.data?.customer?.full_name ?? "Chat"}
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
