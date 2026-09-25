import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/supabase-db"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: provider } = await db.from("providers").select("metadata").eq("id", user.id).single()
  if (!provider) return NextResponse.json({ data: null })

  const metadata = (provider.metadata ?? {}) as Record<string, any>
  return NextResponse.json({ data: metadata?.paymentSettings || null })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { bankCode, accountNumber, accountName, bankName } = body

  const { data: existing } = await db.from("providers").select("metadata").eq("id", user.id).single()

  const paymentSettings = { bankCode, accountNumber, accountName, bankName }

  if (existing) {
    const metadata = ((existing.metadata as Record<string, any>) || {})
    metadata.paymentSettings = paymentSettings
    await db.from("providers").update({ metadata, updated_at: new Date().toISOString() }).eq("id", user.id)
  } else {
    await db.from("providers").insert({ id: user.id, metadata: { paymentSettings } })
  }

  return NextResponse.json({ data: paymentSettings })
}
