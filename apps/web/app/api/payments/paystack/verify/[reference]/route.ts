import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPayment } from "@bixfind/core"
import { createWalletEntry } from "@/lib/payments/wallet-db"
import { withIdempotency } from "@/lib/payments/idempotency"
import { db } from "@/lib/db/supabase-db"
import { EntryType, toKobo } from "@bixfind/core"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reference } = await params

    const paymentData = await verifyPayment(reference)

    const result = await withIdempotency("payment", reference, "verify", async () => {
      if (paymentData.status !== "success") {
        throw new Error("Payment was not successful")
      }

      const bookingId = paymentData.metadata?.bookingId as string
      if (!bookingId) throw new Error("No booking reference in payment metadata")

      const { data: booking } = await db.from("bookings").select("provider_id").eq("id", bookingId).single()
      if (!booking) throw new Error("Booking not found")

      const { data: wallet } = await db.from("wallets").select("id").eq("profile_id", booking.provider_id).single()
      if (!wallet) throw new Error("Provider wallet not found")

      const amountKobo = toKobo(paymentData.amount)

      const entry = await createWalletEntry({
        walletId: wallet.id,
        profileId: booking.provider_id,
        entryType: EntryType.CREDIT,
        amount: amountKobo,
        referenceType: "payment",
        referenceId: reference,
        description: `Payment received for booking ${bookingId}`,
        metadata: { bookingId, paymentReference: reference, channel: paymentData.channel },
      })

      return { verified: true, entryId: entry.id, amount: amountKobo }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/payments/paystack/verify error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 },
    )
  }
}
