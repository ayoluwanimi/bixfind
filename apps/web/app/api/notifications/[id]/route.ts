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

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("profile_id", user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/notifications/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return markRead(request, params)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return markRead(request, params)
}

async function markRead(request: Request, params: Promise<{ id: string }>) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("profile_id", user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/notifications/[id] error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}
