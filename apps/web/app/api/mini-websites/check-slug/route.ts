import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug || slug.length < 3) {
      return NextResponse.json({ available: false, error: 'Slug too short' }, { status: 400 })
    }

    const sanitized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
    if (sanitized.length < 3) {
      return NextResponse.json({ available: false }, { status: 400 })
    }

    const reserved = ['admin', 'api', 'auth', 'login', 'signup', 'support', 'p', 'www', 'mail']
    if (reserved.includes(sanitized)) {
      return NextResponse.json({ available: false })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mini_websites')
      .select('id')
      .eq('slug', sanitized)
      .limit(1)

    if (error) {
      return NextResponse.json({ available: true })
    }

    return NextResponse.json({ available: !data || data.length === 0 })
  } catch {
    return NextResponse.json({ available: true })
  }
}
