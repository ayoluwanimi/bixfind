import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('provider_id')
  const slug = searchParams.get('slug')

  try {
    const supabase = await createClient()

    let query = supabase.from('products').select('*').eq('is_active', true)

    if (providerId) {
      query = query.eq('provider_id', providerId)
    } else if (slug) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', slug)
        .maybeSingle()
      if (user) {
        query = query.eq('provider_id', user.id)
      } else {
        const { data: website } = await supabase
          .from('mini_websites')
          .select('user_id')
          .eq('company_name', slug)
          .maybeSingle()
        if (website) query = query.eq('provider_id', website.user_id)
      }
    } else {
      return NextResponse.json({ error: 'provider_id or slug required' }, { status: 400 })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const normalized = (data || []).map((p: Record<string, unknown>) => ({
      ...p,
      image: p.image || p.image_url || '',
    }))

    return NextResponse.json({ data: normalized })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg, data: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('products').insert({
      provider_id: user.id,
      name: body.name,
      description: body.description || '',
      price: body.price,
      stock: body.stock || 0,
      image: body.image || '',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('products').update({
      name: body.name,
      description: body.description || '',
      price: body.price,
      stock: body.stock || 0,
      image: body.image || '',
    }).eq('id', body.id).eq('provider_id', user.id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('products').delete().eq('id', id).eq('provider_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
