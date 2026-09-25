import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getWalletEntries } from "@/lib/payments/wallet-db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50)
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await getWalletEntries({
      profileId: user.id,
      limit,
      cursor,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/payments/wallet/entries error:", error)
    return NextResponse.json(
      { error: "Failed to fetch wallet entries" },
      { status: 500 },
    )
  }
}
