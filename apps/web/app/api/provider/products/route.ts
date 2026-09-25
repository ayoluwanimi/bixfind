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
      .from("products")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const products = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: Number(p.price) || 0,
      stock: p.stock || 0,
      image: p.image_url || "",
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error("GET /api/provider/products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { data, error } = await db
      .from("products")
      .insert({
        name: body.name,
        description: body.description || "",
        price: body.price || 0,
        stock: body.stock || 0,
        image_url: body.image || "",
        provider_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error("POST /api/provider/products error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { data, error } = await db
      .from("products")
      .update({
        name: body.name,
        description: body.description || "",
        price: body.price || 0,
        stock: body.stock || 0,
        image_url: body.image || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("provider_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error("PUT /api/provider/products error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
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
      .from("products")
      .delete()
      .eq("id", id)
      .eq("provider_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/provider/products error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
