import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Public read-only reviews for a provider: /api/reviews?provider_id=<uuid>
 * Falls back to empty aggregates — the UI never fabricates ratings.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('provider_id')
    if (!providerId) return NextResponse.json({ error: 'provider_id required' }, { status: 400 })
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId)) {
      return NextResponse.json({ error: 'invalid provider_id' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('reviews')
      .select('rating, comment, created_at, customer_id')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ reviews: [], average: 0, count: 0 })

    const reviews = data || []
    const count = reviews.length
    const average = count ? reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / count : 0

    return NextResponse.json({
      reviews: reviews.map((r: any) => ({ rating: r.rating, comment: r.comment, created_at: r.created_at })),
      average: count ? Math.round(average * 10) / 10 : 0,
      count,
    })
  } catch {
    return NextResponse.json({ reviews: [], average: 0, count: 0 })
  }
}
