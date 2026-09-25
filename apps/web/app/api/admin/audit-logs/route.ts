import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '0.0.0.0'
}

function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || ''
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, userId, userName, details, ipAddress, userAgent } = body
    if (!action || !userId) {
      return NextResponse.json({ error: 'action and userId required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('audit_logs')
      .insert({
        action,
        profile_id: UUID_RE.test(userId) ? userId : null,
        entity_type: 'auth',
        entity_id: UUID_RE.test(userId) ? userId : null,
        new_values: { details: details || '', userName: userName || '' },
        ip_address: ipAddress || getIp(request),
        user_agent: userAgent || getUserAgent(request),
        metadata: { source: 'admin_dashboard', userName: userName || '', userIdentifier: userId },
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const search = searchParams.get('search')

    const admin = createAdminClient()
    let query = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })

    if (action && action !== 'all') {
      query = query.eq('action', action)
    }
    if (search) {
      query = query.or(
        `action.ilike.%${search}%,metadata->>userName.ilike.%${search}%,new_values->>details.ilike.%${search}%`
      )
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [], count: count || 0 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
