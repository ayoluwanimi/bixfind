import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .single()

    if (convError || !conv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Try to resolve participant names from users table (where app stores profiles)
    const participantIds = [conv.customer_id, conv.provider_id]
    const { data: users } = await supabase
      .from("users")
      .select("id, name, role, avatar_url")
      .in("id", participantIds)

    const customerUser = users?.find((u: any) => u.id === conv.customer_id)
    const providerUser = users?.find((u: any) => u.id === conv.provider_id)

    const data = {
      ...conv,
      customer: customerUser ? { id: customerUser.id, full_name: customerUser.name, avatar_url: customerUser.avatar_url } : { id: conv.customer_id, full_name: "Customer" },
      provider: providerUser ? { id: providerUser.id, full_name: providerUser.name, logo_url: providerUser.avatar_url } : { id: conv.provider_id, full_name: "Provider" },
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/chat/conversations/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
  }
}
