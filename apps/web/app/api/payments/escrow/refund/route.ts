import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { refundEscrow } from "@/lib/payments/escrow"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, reason } = body
    if (!bookingId || !reason) {
      return NextResponse.json({ error: "bookingId and reason required" }, { status: 400 })
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

    await refundEscrow(bookingId, reason)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/payments/escrow/refund error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Escrow refund failed" },
      { status: 500 },
    )
  }
}
