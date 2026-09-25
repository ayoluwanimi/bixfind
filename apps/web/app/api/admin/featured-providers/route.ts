import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('featured_providers')
      .select('*')
      .order('featured_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch featured providers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { providerId, businessName, logoUrl, primaryCategory, city, state, description } = body
    if (!providerId || !businessName) {
      return NextResponse.json({ error: 'providerId and businessName required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('featured_providers')
      .select('id')
      .eq('provider_id', providerId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ data: existing })
    }

    const { data, error } = await admin
      .from('featured_providers')
      .insert({
        provider_id: providerId,
        business_name: businessName,
        logo_url: logoUrl || '',
        primary_category: primaryCategory || '',
        city: city || '',
        state: state || '',
        description: description || '',
        featured_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to feature provider' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('id')
    if (!providerId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('featured_providers')
      .delete()
      .eq('provider_id', providerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to unfeature provider' }, { status: 500 })
  }
}
