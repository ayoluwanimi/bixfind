import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/bookings — the signed-in customer's real bookings from the DB.
 * The customer bookings page previously read a localStorage key that no flow
 * ever wrote, so customers never saw their actual bookings (and reviews were
 * unreachable). This endpoint is the source of truth.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: rows, error } = await admin
      .from('bookings')
      .select(
        'id, provider_id, service_id, status, escrow_state, total_amount, currency, description, scheduled_date, completed_at, cancelled_at, cancellation_reason, created_at'
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: 'Could not load bookings' }, { status: 500 })
    const bookings = rows || []

    const providerIds = [...new Set(bookings.map((b: any) => b.provider_id).filter(Boolean))]
    const serviceIds = [...new Set(bookings.map((b: any) => b.service_id).filter(Boolean))]

    const providerMap = new Map<string, any>()
    if (providerIds.length > 0) {
      const { data: provs } = await admin
        .from('providers')
        .select('id, business_name, logo_url, city, state, address')
        .in('id', providerIds)
      ;(provs || []).forEach((p: any) => providerMap.set(p.id, p))
    }

    const serviceMap = new Map<string, string>()
    if (serviceIds.length > 0) {
      const { data: svcs } = await admin
        .from('services')
        .select('id, title')
        .in('id', serviceIds)
      ;(svcs || []).forEach((s: any) => serviceMap.set(s.id, s.title))
    }

    // Server truth for "already reviewed" (replaces the per-device localStorage flag)
    const reviewedSet = new Set<string>()
    const bookingIds = bookings.map((b: any) => b.id)
    if (bookingIds.length > 0) {
      const { data: revs } = await admin
        .from('reviews')
        .select('booking_id')
        .in('booking_id', bookingIds)
      ;(revs || []).forEach((r: any) => reviewedSet.add(r.booking_id))
    }

    const normalizeStatus = (raw: unknown): string => {
      switch (String(raw).toUpperCase()) {
        case 'PENDING':
        case 'CONFIRMED':
          return 'upcoming'
        case 'IN_PROGRESS':
        case 'DISPUTED':
          return 'in-progress'
        case 'COMPLETED':
          return 'completed'
        case 'CANCELLED':
          return 'cancelled'
        default:
          return 'in-progress'
      }
    }

    return NextResponse.json({
      bookings: bookings.map((b: any) => {
        const prov = providerMap.get(b.provider_id) || {}
        const location = [prov.address, prov.city].filter(Boolean).join(', ')
        return {
          id: b.id,
          service: serviceMap.get(b.service_id) || (b.description ? String(b.description).slice(0, 80) : 'Service booking'),
          provider: prov.business_name || 'Provider',
          providerName: prov.business_name || 'Provider',
          logoUrl: prov.logo_url || '',
          date: b.scheduled_date || b.created_at,
          location,
          notes: b.description || '',
          amount: Number(b.total_amount) || 0,
          currency: b.currency || 'NGN',
          status: normalizeStatus(b.status),
          rawStatus: String(b.status || ''),
          reviewed: reviewedSet.has(b.id),
          escrowState: b.escrow_state || null,
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
  }
}
