import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const MAX_ATTEMPTS = 3
const LOCKOUT_MINUTES = 5

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getAdmin() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createAdminClient()
  } catch {
    return null
  }
}

async function fireAuditLog(admin: ReturnType<typeof createAdminClient> | null, action: string, userId: string, userName: string, details: string, ip: string, ua: string) {
  if (!admin) return
  const { error } = await admin.from('audit_logs').insert({
    action,
    profile_id: null,
    entity_type: 'auth',
    entity_id: UUID_RE.test(userId) ? userId : null,
    new_values: { details, userName },
    ip_address: ip,
    user_agent: ua,
    metadata: { source: 'auth_login', userName, userIdentifier: userId },
  })
  if (error) console.error('audit log insert failed:', error.message)
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const ip = getIp(request)
    const ua = getUserAgent(request)

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = getAdmin()

    if (admin) {
      const fiveMinAgo = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()

      const { count } = await admin
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('success', false)
        .gte('attempt_time', fiveMinAgo)

      if (count && count >= MAX_ATTEMPTS) {
        await admin.from('login_attempts').insert({
          email: normalizedEmail,
          ip_address: ip,
          success: false,
        })

        await fireAuditLog(admin, 'login_locked', normalizedEmail, normalizedEmail, `Login blocked - account locked after ${count} failed attempts`, ip, ua)

        return NextResponse.json({
          error: `Account locked. Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
        }, { status: 429 })
      }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      if (admin) {
        await admin.from('login_attempts').insert({
          email: normalizedEmail,
          ip_address: ip,
          success: false,
        })
      }
      await fireAuditLog(admin, 'login_failed', normalizedEmail, normalizedEmail, `Failed login attempt from IP ${ip}: ${error.message}`, ip, ua)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (admin) {
      await admin.from('login_attempts').insert({
        email: normalizedEmail,
        ip_address: ip,
        success: true,
      })
    }

    await fireAuditLog(admin, 'login', data.user?.id || normalizedEmail, normalizedEmail, `Successful login from IP ${ip}`, ip, ua)

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to process login', detail: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    return NextResponse.json({ exists: !!existingUsers })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
