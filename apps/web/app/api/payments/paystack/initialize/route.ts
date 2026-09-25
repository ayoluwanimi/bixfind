import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { initializePayment, toKobo } from "@bixfind/core"
import { generateIdempotencyKey } from "@/lib/payments/idempotency"
import { ensureWallet } from "@/lib/payments/wallet-db"
import { db } from "@/lib/db/supabase-db"

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
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 })
    }

    const { data: booking, error: bErr } = await db
      .from("bookings")
      .select("*, customer:profiles(email)")
      .eq("id", bookingId)
      .single()

    if (bErr || !booking || booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    await ensureWallet(user.id)

    const amountKobo = toKobo(Math.round(Number(booking.total_amount) * 100))
    const reference = `BIXFIND_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const result = await initializePayment({
      email: (booking.customer as any)?.email ?? user.email!,
      amount: amountKobo,
      reference,
      metadata: {
        bookingId,
        customerId: user.id,
        providerId: booking.provider_id,
        paymentType: "booking",
      },
    })

    return NextResponse.json({
      authorizationUrl: result.data.authorization_url,
      reference,
      accessCode: result.data.access_code,
    })
  } catch (error) {
    console.error("POST /api/payments/paystack/initialize error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initialize payment" },
      { status: 500 },
    )
  }
}
