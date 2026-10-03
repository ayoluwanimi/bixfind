import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { refundEscrow } from '@/lib/payments/escrow'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Only bookings that haven't started can be cancelled by the customer.
// IN_PROGRESS/COMPLETED/DISPUTED go through provider or dispute flows.
const CANCELLABLE = new Set(['PENDING', 'CONFIRMED'])

/**
 * PATCH /api/bookings/[id] — { action: 'cancel' }
 * Cancels the customer's own booking. If escrow is HELD, the held payment is
 * refunded FIRST (refund failure aborts the cancellation so escrow never
 * outlives the booking).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    if (body?.action !== 'cancel') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking } = await admin
      .from('bookings')
      .select('id, customer_id, status, escrow_state')
      .eq('id', id)
      .maybeSingle()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.customer_id !== user.id) {
      return NextResponse.json({ error: 'You can only cancel your own bookings' }, { status: 403 })
    }

    const status = String(booking.status || '').toUpperCase()
    if (status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 409 })
    }
    if (!CANCELLABLE.has(status)) {
      return NextResponse.json({ error: 'This booking can no longer be cancelled — contact support' }, { status: 409 })
    }

    if (String(booking.escrow_state) === 'HELD') {
      try {
        await refundEscrow(id, 'Customer cancelled booking')
      } catch (e: any) {
        return NextResponse.json(
          { error: `Could not release the held payment: ${e?.message || 'refund failed'}` },
          { status: 500 }
        )
      }
    }

    const { error: updErr } = await admin
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Cancelled by customer',
      })
      .eq('id', id)

    if (updErr) return NextResponse.json({ error: 'Could not cancel booking' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
