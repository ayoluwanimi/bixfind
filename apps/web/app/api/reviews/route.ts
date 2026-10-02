import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
      .select('rating, title, body, created_at, is_verified')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return NextResponse.json({ reviews: [], average: 0, count: 0 })

    const reviews = data || []
    const count = reviews.length
    const average = count ? reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / count : 0

    return NextResponse.json({
      reviews: reviews.map((r: any) => ({ rating: r.rating, title: r.title, body: r.body, created_at: r.created_at, is_verified: r.is_verified })),
      average: count ? Math.round(average * 10) / 10 : 0,
      count,
    })
  } catch {
    return NextResponse.json({ reviews: [], average: 0, count: 0 })
  }
}

// ─── POST: submit a review for a COMPLETED booking ──────────────
const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    // Identity comes from the session — never from the request body
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 })

    const parsed = reviewSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid review', detail: parsed.error.issues.slice(0, 3) }, { status: 400 })
    }
    const { booking_id, rating, title, body } = parsed.data

    const admin = createAdminClient()

    // The booking must exist, belong to this user, and be completed
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, customer_id, provider_id, status, escrow_state')
      .eq('id', booking_id)
      .maybeSingle()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    if (booking.customer_id !== user.id) {
      return NextResponse.json({ error: 'You can only review your own bookings' }, { status: 403 })
    }
    if (String(booking.status).toUpperCase() !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can review a booking once it is completed' }, { status: 409 })
    }

    // One review per booking (enforced in the DB too) — check first for a clean error
    const { data: existing } = await admin
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .limit(1)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'You already reviewed this booking' }, { status: 409 })
    }

    const { error: insertErr } = await admin.from('reviews').insert({
      booking_id,
      reviewer_id: user.id,
      provider_id: booking.provider_id,
      rating,
      title: title || null,
      body: body || null,
      // Bookings flow through escrow — mark escrow-backed reviews as verified
      is_verified: booking.escrow_state != null,
    })

    if (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'You already reviewed this booking' }, { status: 409 })
      }
      return NextResponse.json({ error: `Could not save review: ${insertErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
