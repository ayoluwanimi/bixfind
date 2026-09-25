import { NextResponse } from "next/server"
import { createWalletEntry } from "@/lib/payments/wallet-db"
import { db } from "@/lib/db/supabase-db"
import { EntryType, toKobo } from "@bixfind/core"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const crypto = await import("crypto")
    const expectedSignature = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const event = body.event as string
    const data = body.data as Record<string, unknown>

    switch (event) {
      case "charge.success": {
        const reference = data.reference as string
        const metadata = data.metadata as Record<string, unknown> | undefined
        const bookingId = metadata?.bookingId as string | undefined
        const providerId = metadata?.providerId as string | undefined

        if (!bookingId || !providerId) {
          return NextResponse.json({ error: "Missing booking/provider metadata" }, { status: 400 })
        }

        const { data: wallet } = await db.from("wallets").select("id").eq("profile_id", providerId).single()
        if (!wallet) {
          return NextResponse.json({ error: "Provider wallet not found" }, { status: 404 })
        }

        const amountKobo = toKobo(data.amount as number)

        await createWalletEntry({
          walletId: wallet.id,
          profileId: providerId,
          entryType: EntryType.CREDIT,
          amount: amountKobo,
          referenceType: "payment",
          referenceId: reference,
          description: `Payment received for booking ${bookingId}`,
          metadata: { bookingId, paymentReference: reference, event },
        })

        break
      }

      case "transfer.success": {
        const transferReference = data.reference as string
        const { data: entry } = await db
          .from("wallet_entries")
          .select("id, metadata")
          .eq("reference_id", transferReference)
          .eq("entry_type", EntryType.PAYOUT)
          .limit(1)
          .single()

        if (entry) {
          const meta = (entry.metadata as Record<string, any>) || {}
          meta.transferStatus = "success"
          await db.from("wallet_entries").update({ metadata: meta }).eq("id", entry.id)
        }
        break
      }

      case "transfer.failed": {
        const failedReference = data.reference as string
        const { data: failedEntry } = await db
          .from("wallet_entries")
          .select("*")
          .eq("reference_id", failedReference)
          .eq("entry_type", EntryType.PAYOUT)
          .limit(1)
          .single()

        if (failedEntry) {
          const { data: wallet } = await db.from("wallets").select("id").eq("id", failedEntry.wallet_id).single()
          if (wallet) {
            const refundAmount = toKobo(Math.round(Math.abs(Number(failedEntry.amount)) * 100))
            await createWalletEntry({
              walletId: wallet.id,
              profileId: failedEntry.profile_id,
              entryType: EntryType.REFUND,
              amount: refundAmount,
              referenceType: "transfer_failed",
              referenceId: failedReference,
              description: `Refund for failed transfer ${failedReference}`,
              metadata: { originalEntryId: failedEntry.id },
            })
          }
        }
        break
      }

      case "subscription.create":
        break

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("POST /api/payments/paystack/webhook error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    )
  }
}
