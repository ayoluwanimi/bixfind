import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const MAX_ATTEMPTS = 5

const rateMap = new Map<string, { count: number; resetAt: number }>()

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip') || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

async function supabaseUpsertUser(supabaseUserId: string, email: string, fullName: string, phone: string, userType: string) {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { error } = await admin.from('users').upsert({
      id: supabaseUserId,
      email,
      name: fullName,
      phone: phone || '',
      role: userType || 'customer',
      is_verified: true,
      is_active: true,
      is_suspended: false,
      wallet: JSON.stringify({ balance: 0 }),
      created_at: now,
      updated_at: now,
    }, { onConflict: 'id' })

    if (error) {
      console.warn('Supabase user insert failed (table may not exist yet):', error.message)
    }
  } catch (err) {
    console.warn('Failed to upsert user into Supabase DB:', err)
  }
}

export async function POST(request: Request) {
  const ip = getIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 })
  }

  try {
    const { email, password, fullName, name, phone, userType, role } = await request.json()
    const displayName = fullName || name

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const effectiveUserType = role || userType || 'customer'
    const metadata = {
      full_name: displayName,
      phone: phone || '',
      role: effectiveUserType,
      user_type: effectiveUserType,
    }

    const admin = getAdminClient()
    if (admin) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 })
      }

      // Insert into Supabase's public.users table so admin & homepage counters update
      await supabaseUpsertUser(created.user.id, normalizedEmail, displayName, phone || '', effectiveUserType)

      // Sign in to return a valid session
      const supabase = await createClient()
      const { data: signedIn, error: signInErr } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInErr || !signedIn.session) {
        return NextResponse.json({
          success: true,
          user: created.user,
          session: null,
          message: 'Account created. Please log in.',
        })
      }

      return NextResponse.json({
        success: true,
        user: signedIn.user,
        session: signedIn.session,
      })
    }

    // Fallback — admin client not available (no service role key)
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: metadata },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Insert into Supabase DB
    if (data.user) {
      await supabaseUpsertUser(data.user.id, normalizedEmail, displayName, phone || '', effectiveUserType)
    }

    // Auto-confirm if email confirmation is enabled and no session returned
    if (data.user && !data.session) {
      try {
        const adminFallback = createAdminClient()
        await adminFallback.auth.admin.updateUserById(data.user.id, { email_confirm: true })

        const { data: signedIn, error: signInErr } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (!signInErr && signedIn.session) {
          return NextResponse.json({
            success: true,
            user: signedIn.user,
            session: signedIn.session,
          })
        }
      } catch {
        console.warn('Auto-confirm failed')
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Something went wrong', detail: msg }, { status: 500 })
  }
}

function getAdminClient() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createAdminClient()
  } catch {
    return null
  }
}
