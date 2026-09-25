import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(
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

    const now = new Date().toISOString()

    const { error: msgError } = await supabase
      .from("messages")
      .update({ read_at: now })
      .eq("conversation_id", id)
      .neq("sender_id", user.id)
      .is("read_at", null)

    if (msgError) throw msgError

    const updateField =
      conv.customer_id === user.id
        ? { unread_customer: 0 }
        : { unread_provider: 0 }

    const { error: convError } = await supabase
      .from("conversations")
      .update(updateField)
      .eq("id", id)

    if (convError) throw convError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/chat/read error:", error)
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
  }
}
