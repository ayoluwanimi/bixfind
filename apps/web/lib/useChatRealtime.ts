"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Message } from "@bixfind/core"

export function useChatRealtime(conversationId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId || !supabase) return

    let msgChannel: any, convChannel: any

    try {
      msgChannel = supabase
        .channel(`realtime:messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            queryClient.setQueryData<Message[]>(["messages", conversationId], (old) =>
              old ? [...old, newMsg] : [newMsg],
            )
            queryClient.invalidateQueries({ queryKey: ["conversations"] })
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            if (msgChannel) supabase.removeChannel(msgChannel)
            msgChannel = null
          }
        })

      convChannel = supabase
        .channel(`realtime:conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
            filter: `id=eq.${conversationId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            if (convChannel) supabase.removeChannel(convChannel)
            convChannel = null
          }
        })
    } catch {
    }

    return () => {
      if (msgChannel) {
        try { supabase.removeChannel(msgChannel) } catch {}
      }
      if (convChannel) {
        try { supabase.removeChannel(convChannel) } catch {}
      }
    }
  }, [conversationId, queryClient])
}
