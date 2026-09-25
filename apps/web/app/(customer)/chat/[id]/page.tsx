"use client"

import { useParams, useRouter } from "next/navigation"
import { ChatThread } from "@bixfind/ui"
import { useConversation, useSendMessage, useMarkAsRead } from "@bixfind/core"
import { storage } from "@/lib/storage"
import { useChatRealtime } from "@/lib/useChatRealtime"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const user = storage.getUser()
  const userId = user?.id

  const { conversation, messages } = useConversation(conversationId)
  const { sendMessage, isPending } = useSendMessage(conversationId)
  const { markAsRead } = useMarkAsRead(conversationId)

  useChatRealtime(conversationId)

  markAsRead()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-white/60">Please sign in to use chat</p>
      </div>
    )
  }

  if (conversation.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="text-white/40 animate-spin" />
      </div>
    )
  }

  const conv = conversation.data
  const participantName = conv?.provider?.business_name ?? conv?.customer?.full_name ?? "Chat"

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button
          onClick={() => router.push("/chat")}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm font-medium text-white">{participantName}</p>
        </div>
      </div>

      <ChatThread
        messages={messages.data ?? []}
        currentUserId={userId}
        conversationName={participantName}
        onSend={(body, attachments) => sendMessage(body, attachments)}
        isSending={isPending}
        isLoading={messages.isLoading}
        className="flex-1"
      />
    </div>
  )
}
