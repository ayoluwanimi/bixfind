import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { holdEscrow } from "@/lib/payments/escrow"
import { generateIdempotencyKey } from "@/lib/payments/idempotency"
import { toKobo } from "@bixfind/core"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, amount } = body
    if (!bookingId || !amount) {
      return NextResponse.json({ error: "bookingId and amount required" }, { status: 400 })
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

    const amountKobo = toKobo(amount)
    const idempotencyKey = generateIdempotencyKey("escrow", bookingId, "hold")

    const result = await holdEscrow(bookingId, amountKobo, idempotencyKey)

    return NextResponse.json(result)
  } catch (error) {
    console.error("POST /api/payments/escrow/hold error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Escrow hold failed" },
      { status: 500 },
    )
  }
}
