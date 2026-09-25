"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef } from "react"

export type MessageAttachment = { type: "image"; url: string } | { type: "voice"; url: string; duration: number }

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  attachments: MessageAttachment[]
  read_at: string | null
  delivered_at: string | null
  created_at: string
  pending?: boolean
  failed?: boolean
}

export interface Conversation {
  id: string
  customer_id: string
  provider_id: string
  booking_id?: string | null
  last_message_at: string | null
  last_message_body: string | null
  unread_customer: number
  unread_provider: number
  created_at: string
  customer?: { id: string; full_name: string; avatar_url?: string }
  provider?: { id: string; business_name: string; logo_url?: string }
}

const CONVERSATIONS_KEY = "conversations"
const CONVERSATION_KEY = (id: string) => ["conversation", id]
const MESSAGES_KEY = (id: string) => ["messages", id]
const SEND_MESSAGE_KEY = "send-message"
const MARK_READ_KEY = "mark-read"

async function fetchFromApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: () => fetchFromApi<Conversation[]>("/api/chat/conversations"),
    enabled: !!userId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useConversation(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  const convQuery = useQuery({
    queryKey: CONVERSATION_KEY(conversationId ?? "_"),
    queryFn: () => {
      if (!conversationId) throw new Error("No conversation id")
      return fetchFromApi<Conversation>(`/api/chat/conversations/${conversationId}`)
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  })

  const messagesQuery = useQuery({
    queryKey: MESSAGES_KEY(conversationId ?? "_"),
    queryFn: () => {
      if (!conversationId) throw new Error("No conversation id")
      return fetchFromApi<Message[]>(`/api/chat/conversations/${conversationId}/messages`)
    },
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  })

  return { conversation: convQuery, messages: messagesQuery }
}

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient()
  const retryQueue = useRef<Message[]>([])

  const mutation = useMutation({
    mutationKey: [SEND_MESSAGE_KEY, conversationId],
    mutationFn: async (data: { body: string; attachments?: MessageAttachment[] }) => {
      if (!conversationId) throw new Error("No conversation id")
      return fetchFromApi<Message>(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onMutate: async (data) => {
      if (!conversationId) return
      await queryClient.cancelQueries({ queryKey: MESSAGES_KEY(conversationId) })
      const previous = queryClient.getQueryData<Message[]>(MESSAGES_KEY(conversationId))
      const optimistic: Message = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: "__current__",
        body: data.body,
        attachments: data.attachments ?? [],
        read_at: null,
        delivered_at: null,
        created_at: new Date().toISOString(),
        pending: true,
      }
      queryClient.setQueryData<Message[]>(MESSAGES_KEY(conversationId), (old) =>
        old ? [...old, optimistic] : [optimistic],
      )
      return { previous }
    },
    onError: (_err, _data, context) => {
      if (context?.previous && conversationId) {
        queryClient.setQueryData(MESSAGES_KEY(conversationId), context.previous)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] })
    },
  })

  const sendMessage = useCallback(
    (body: string, attachments?: MessageAttachment[]) => {
      mutation.mutate({ body, attachments })
    },
    [mutation],
  )

  return { sendMessage, isPending: mutation.isPending, error: mutation.error }
}

export function useMarkAsRead(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationKey: [MARK_READ_KEY, conversationId],
    mutationFn: async () => {
      if (!conversationId) throw new Error("No conversation id")
      return fetchFromApi(`/api/chat/conversations/${conversationId}/read`, { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] })
    },
  })

  return { markAsRead: mutation.mutate, isPending: mutation.isPending, error: mutation.error }
}
