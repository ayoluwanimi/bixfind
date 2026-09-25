import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notify } from "@/lib/notifications-server"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("customer_id, provider_id")
      .eq("id", id)
      .single()

    if (!conv || (conv.customer_id !== user.id && conv.provider_id !== user.id)) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("GET /api/chat/messages error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: conv } = await supabase
      .from("conversations")
      .select("customer_id, provider_id")
      .eq("id", id)
      .single()

    if (!conv || (conv.customer_id !== user.id && conv.provider_id !== user.id)) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 })
    }

    const body = await request.json()
    const { body: messageBody, attachments } = body

    if (!messageBody && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Message body or attachments required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        body: messageBody ?? "",
        media_urls: attachments ?? [],
      })
      .select()
      .single()

    if (error) throw error

    const recipientId = conv.customer_id === user.id ? conv.provider_id : conv.customer_id
    await notify(recipientId, "MESSAGE", {
      title: "New Message",
      body: messageBody?.substring(0, 200) ?? "Sent an attachment",
      metadata: { conversation_id: id, message_id: data.id },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("POST /api/chat/messages error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
