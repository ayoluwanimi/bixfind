import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTicket, getAllTickets } from '@/lib/support-store'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allTickets = getAllTickets()
    const userTickets = allTickets.filter(
      t => t.userEmail === user.email
    )

    return NextResponse.json({ success: true, tickets: userTickets })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to fetch tickets', detail: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subject, message, userName, userEmail, userPhone, category } = body

    if (!subject || !message || !userName || !userEmail) {
      return NextResponse.json({ error: 'Subject, message, name, and email are required' }, { status: 400 })
    }

    const ticket = createTicket({ subject, message, userName, userEmail, userPhone, category })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to create ticket', detail: msg }, { status: 500 })
  }
}
