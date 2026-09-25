import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('provider_id')

    if (!providerId) {
      return NextResponse.json({ data: [], error: 'provider_id required' }, { status: 400 })
    }

    const admin = createAdminClient()
    let query = admin
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)

    if (searchParams.get('published') === 'true') {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
