import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureWallet } from "@/lib/payments/wallet-db"
import type { WalletSummary } from "@bixfind/core"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const wallet = await ensureWallet(user.id)
    const summary: WalletSummary = {
      balance: Math.round(Number(wallet.balance) * 100) as any,
      pending: Math.round(Number(wallet.balance_hold) * 100) as any,
      available: Math.round((Number(wallet.balance) - Number(wallet.balance_hold)) * 100) as any,
      currency: wallet.currency,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("GET /api/payments/wallet error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wallet" },
      { status: 500 },
    )
  }
}
