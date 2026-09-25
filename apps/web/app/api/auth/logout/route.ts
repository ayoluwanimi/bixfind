import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '0.0.0.0'
}

function getAdmin() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createAdminClient()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = getAdmin()

    const { error } = await supabase.auth.signOut()

    if (error) {
      if (admin && user) {
        const ip = getIp(request)
        const { error: auditErr } = await admin.from('audit_logs').insert({
          action: 'logout_failed',
          profile_id: user.id,
          entity_type: 'auth',
          entity_id: user.id,
          new_values: { details: `Logout failed: ${error.message}`, userName: user.email },
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || '',
          metadata: { source: 'auth_logout', userName: user.email, userIdentifier: user.id },
        })
        if (auditErr) console.error('audit log insert failed:', auditErr.message)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (admin && user) {
      const ip = getIp(request)
      const { error: auditErr } = await admin.from('audit_logs').insert({
        action: 'logout',
        profile_id: user.id,
        entity_type: 'auth',
        entity_id: user.id,
        new_values: { details: 'User logged out', userName: user.email },
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || '',
        metadata: { source: 'auth_logout', userName: user.email, userIdentifier: user.id },
      })
      if (auditErr) console.error('audit log insert failed:', auditErr.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to log out', detail: msg }, { status: 500 })
  }
}
