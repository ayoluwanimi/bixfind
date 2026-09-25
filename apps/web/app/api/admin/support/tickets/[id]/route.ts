import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTicketById, updateTicket, addReply } from '@/lib/support-store'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const userType = user.user_metadata?.user_type || user.user_metadata?.role || ''
  return userType === 'admin'
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const ticket = getTicketById(id)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to fetch ticket', detail: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const { status, priority, reply, replyAuthorEmail, replyAuthorName, isAdmin } = body

    if (reply) {
      const updated = addReply(id, {
        body: reply,
        authorEmail: replyAuthorEmail || 'admin@bixfind.indevs.in',
        authorName: replyAuthorName || 'Support Team',
        isAdmin: isAdmin ?? true,
      })
      if (!updated) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      return NextResponse.json({ success: true, ticket: updated })
    }

    if (status || priority) {
      const updated = updateTicket(id, { ...(status && { status }), ...(priority && { priority }) })
      if (!updated) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      return NextResponse.json({ success: true, ticket: updated })
    }

    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to update ticket', detail: msg }, { status: 500 })
  }
}
