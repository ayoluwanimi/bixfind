import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db/supabase-db"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await db
      .from("services")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const services = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description || "",
      category: s.category || "",
      price: Number(s.price) || 0,
      duration: 60,
      active: s.is_active !== false,
    }))

    return NextResponse.json({ services })
  } catch (error) {
    console.error("GET /api/provider/services error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { data, error } = await db
      .from("services")
      .insert({
        name: body.name,
        description: body.description || "",
        category: body.category || "",
        price: body.price || 0,
        price_type: "fixed",
        provider_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error("POST /api/provider/services error:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { data, error } = await db
      .from("services")
      .update({
        name: body.name,
        description: body.description || "",
        category: body.category || "",
        price: body.price || 0,
        is_active: body.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("provider_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error("PUT /api/provider/services error:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { error } = await db
      .from("services")
      .delete()
      .eq("id", id)
      .eq("provider_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/provider/services error:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
