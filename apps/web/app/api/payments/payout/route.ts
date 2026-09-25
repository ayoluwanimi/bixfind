import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { initiateTransfer, createTransferRecipient, toKobo } from "@bixfind/core"
import { createWalletEntry, ensureWallet } from "@/lib/payments/wallet-db"
import { db } from "@/lib/db/supabase-db"
import { EntryType } from "@bixfind/core"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, bankCode, accountNumber, accountName, mfaCode } = body

    if (!amount || !bankCode || !accountNumber || !accountName || !mfaCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: profile } = await db.from("profiles").select("id").eq("id", user.id).single()
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const wallet = await ensureWallet(user.id)
    const amountKobo = toKobo(amount)
    const availableKobo = Math.round(
      (Number(wallet.balance) - Number(wallet.balance_hold)) * 100,
    ) as unknown as ReturnType<typeof toKobo>

    if (amountKobo > availableKobo) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const payoutReference = `PO_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const recipient = await createTransferRecipient({
      type: "nuban",
      name: accountName,
      accountNumber,
      bankCode,
    })

    const walletEntry = await createWalletEntry({
      walletId: wallet.id,
      profileId: user.id,
      entryType: EntryType.PAYOUT,
      amount: amountKobo,
      referenceType: "payout",
      referenceId: payoutReference,
      description: `Payout to ${accountName} (${bankCode} - ${accountNumber})`,
      metadata: { bankCode, accountNumber, accountName, mfaVerified: true },
    })

    const transfer = await initiateTransfer({
      amount: amountKobo,
      reference: payoutReference,
      reason: "Provider payout",
      recipientCode: recipient.recipient_code,
    })

    return NextResponse.json({
      id: walletEntry.id,
      reference: payoutReference,
      amount: amountKobo,
      status: "processing",
      transferCode: transfer.data.transfer_code,
    })
  } catch (error) {
    console.error("POST /api/payments/payout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payout failed" },
      { status: 500 },
    )
  }
}
