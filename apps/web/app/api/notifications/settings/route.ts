import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const DEFAULT_PREFERENCES = [
  { type: "BOOKING_NEW", in_app: true, push: true, email: true },
  { type: "BOOKING_UPDATE", in_app: true, push: true, email: true },
  { type: "MESSAGE", in_app: true, push: true, email: false },
  { type: "REVIEW", in_app: true, push: true, email: false },
  { type: "PAYOUT", in_app: true, push: true, email: true },
  { type: "SYSTEM", in_app: true, push: false, email: false },
  { type: "LOW_STOCK", in_app: true, push: true, email: false },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return NextResponse.json({
        preferences: DEFAULT_PREFERENCES,
        push_enabled: true,
        email_enabled: true,
      })
    }

    return NextResponse.json({
      preferences: (data.preferences as any[]) ?? DEFAULT_PREFERENCES,
      push_enabled: data.push_enabled ?? true,
      email_enabled: data.email_enabled ?? true,
      quiet_hours_start: data.quiet_hours_start ?? undefined,
      quiet_hours_end: data.quiet_hours_end ?? undefined,
    })
  } catch (error) {
    console.error("GET /api/notifications/settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
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

    const { data: existing } = await supabase
      .from("notification_settings")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("notification_settings")
        .update(body)
        .eq("profile_id", user.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from("notification_settings")
        .insert({ profile_id: user.id, ...body })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/notifications/settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
