import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try with joins first, fall back to plain query if joins fail (table may be missing columns)
    let query = supabase
      .from("conversations")
      .select("*")
      .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    const { data, error } = await query

    if (error) {
      console.warn("conversations table query failed:", error.message)
      return NextResponse.json([])
    }

    if (!data || data.length === 0) return NextResponse.json([])

    // Resolve participant names from users table
    const allIds = [...new Set(data.flatMap((c: any) => [c.customer_id, c.provider_id]))]
    const { data: users } = await supabase
      .from("users")
      .select("id, name, role, avatar_url")
      .in("id", allIds)

    const userMap = new Map((users ?? []).map((u: any) => [u.id, u]))

    const enriched = data.map((conv: any) => {
      const cu = userMap.get(conv.customer_id)
      const pu = userMap.get(conv.provider_id)
      return {
        ...conv,
        customer: cu ? { id: cu.id, full_name: cu.name, avatar_url: cu.avatar_url } : { id: conv.customer_id, full_name: "Customer" },
        provider: pu ? { id: pu.id, full_name: pu.name, avatar_url: pu.avatar_url } : { id: conv.provider_id, full_name: "Provider" },
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("GET /api/chat/conversations error:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { provider_id, booking_id } = body

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", user.id)
      .eq("provider_id", provider_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(existing)
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        customer_id: user.id,
        provider_id,
        booking_id: booking_id ?? null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("POST /api/chat/conversations error:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
