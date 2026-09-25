import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSubaccount, verifyAccountNumber, getBanks } from "@bixfind/core"
import { db } from "@/lib/db/supabase-db"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: provider } = await db.from("providers").select("*").eq("id", user.id).single()
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const body = await request.json()
    const { bankCode, accountNumber, businessName } = body

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "bankCode and accountNumber required" }, { status: 400 })
    }

    const verified = await verifyAccountNumber({ accountNumber, bankCode })

    const subaccount = await createSubaccount({
      businessName: businessName ?? provider.business_name,
      settlementBank: bankCode,
      accountNumber,
      percentageCharge: Number(provider.commission_rate),
    })

    const metadata = (provider.metadata as Record<string, any>) || {}
    metadata.paystackSubaccountCode = subaccount.data.subaccount_code
    metadata.bankAccount = { bankCode, accountNumber, accountName: verified.account_name }

    await db.from("providers").update({ metadata, updated_at: new Date().toISOString() }).eq("id", user.id)

    return NextResponse.json({
      subaccountCode: subaccount.data.subaccount_code,
      accountName: verified.account_name,
    })
  } catch (error) {
    console.error("POST /api/payments/subaccounts error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Subaccount creation failed" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const banks = await getBanks()
    return NextResponse.json({ banks })
  } catch (error) {
    console.error("GET /api/payments/subaccounts error:", error)
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 },
    )
  }
}
