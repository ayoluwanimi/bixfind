import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/supabase-db"
import { EntryType, formatWalletEntry } from "@bixfind/core"

export const runtime = "nodejs"

export async function GET(_request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: entries } = await db
      .from("wallet_entries")
      .select("*")
      .eq("profile_id", user.id)
      .eq("entry_type", EntryType.PAYOUT)
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json({
      payouts: (entries ?? []).map(formatWalletEntry),
    })
  } catch (error) {
    console.error("GET /api/payments/payout/history error:", error)
    return NextResponse.json(
      { error: "Failed to fetch payout history" },
      { status: 500 },
    )
  }
}
