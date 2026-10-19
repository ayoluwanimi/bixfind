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

/**
 * POST /api/bookings — create a real booking row.
 * Body: { serviceId, scheduledDate, quantity?, notes? }
 *
 * This was the missing piece of the funnel: nothing in the codebase ever
 * wrote to `bookings`, so customers could never book. Validation is
 * server-side; payment/escrow stays a deliberate separate step
 * (POST /api/payments/escrow/hold), so a booking is never silently
 * charged. RLS policy `bookings_customer_insert` enforces the same
 * ownership rule at the DB level for non-admin clients.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to book a service' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const serviceId = String(body.serviceId || '')
    if (!UUID_RE.test(serviceId)) {
      return NextResponse.json({ error: 'A valid serviceId is required' }, { status: 400 })
    }

    const scheduledDate = String(body.scheduledDate || '')
    const when = new Date(scheduledDate)
    if (!scheduledDate || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'scheduledDate must be a valid date in the future' }, { status: 400 })
    }

    const quantity = Number.isFinite(Number(body.quantity)) ? Math.floor(Number(body.quantity)) : 1
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'quantity must be between 1 and 100' }, { status: 400 })
    }

    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : ''

    const admin = createAdminClient()

    const { data: service } = await admin
      .from('services')
      .select('id, provider_id, title, price, currency, is_published, is_approved, price_type')
      .eq('id', serviceId)
      .maybeSingle()

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    if (!service.is_published || !service.is_approved) {
      return NextResponse.json({ error: 'This service is not open for bookings' }, { status: 409 })
    }

    // A customer must not book their own service.
    if (service.provider_id === user.id) {
      return NextResponse.json({ error: 'You cannot book your own service' }, { status: 409 })
    }

    const unitPrice = Math.max(0, Number(service.price) || 0)
    const totalAmount = Math.round(unitPrice * quantity * 100) / 100

    const { data: booking, error: insertErr } = await admin
      .from('bookings')
      .insert({
        customer_id: user.id,
        provider_id: service.provider_id,
        service_id: service.id,
        status: 'PENDING',
        description: notes || null,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        currency: service.currency || 'NGN',
        scheduled_date: when.toISOString(),
      })
      .select('id, provider_id, service_id, status, escrow_state, total_amount, unit_price, quantity, currency, description, scheduled_date, created_at')
      .single()

    if (insertErr || !booking) {
      console.error('POST /api/bookings insert error:', insertErr)
      return NextResponse.json({ error: 'Could not create booking' }, { status: 500 })
    }

    // Shape the response like GET /api/bookings items so clients can append it
    // to their list directly.
    const { data: prov } = await admin
      .from('providers')
      .select('id, business_name, logo_url, city, state, address')
      .eq('id', service.provider_id)
      .maybeSingle()

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          service: service.title || 'Service booking',
          provider: prov?.business_name || 'Provider',
          providerName: prov?.business_name || 'Provider',
          logoUrl: prov?.logo_url || '',
          date: booking.scheduled_date,
          location: [prov?.address, prov?.city].filter(Boolean).join(', '),
          notes: booking.description || '',
          amount: Number(booking.total_amount) || 0,
          currency: booking.currency || 'NGN',
          status: 'upcoming',
          rawStatus: booking.status,
          reviewed: false,
          escrowState: null,
          // Next step in the money flow, kept explicit and client-driven.
          payment: {
            escrowHoldUrl: '/api/payments/escrow/hold',
            amountKobo: Math.round(totalAmount * 100),
          },
        },
      },
      { status: 201 }
    )
  } catch (e) {
    console.error('POST /api/bookings error:', e)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
