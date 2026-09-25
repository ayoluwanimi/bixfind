import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { releaseEscrow } from "@/lib/payments/escrow"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId } = body
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 })
    }

    const { data: booking } = await supabase
      .from("bookings")
      .select("customer_id, provider_id")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.customer_id !== user.id && booking.provider_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await releaseEscrow(bookingId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("POST /api/payments/escrow/release error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Escrow release failed" },
      { status: 500 },
    )
  }
}
