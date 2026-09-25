import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekrpfyrvpdaitzhlxxxc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userType = user.user_metadata?.user_type || user.user_metadata?.role || ''
  if (userType !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({
    success: true,
    message: 'Recovery endpoint is no longer needed. All data is in Supabase.',
    results: { users: 0, websites: 0, errors: [] }
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userType = user.user_metadata?.user_type || user.user_metadata?.role || ''
  if (userType !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status: { supabase: string; api: string; supabaseUsers: number; supabaseWebsites: number } = {
    supabase: 'unknown',
    api: 'unknown',
    supabaseUsers: 0,
    supabaseWebsites: 0
  }

  // Check Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    status.supabase = res.ok ? 'active' : 'error'
  } catch {
    status.supabase = 'error'
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&limit=1000`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    if (res.ok) {
      const data = await res.json()
      status.supabaseUsers = Array.isArray(data) ? data.length : 0
    }
  } catch {}

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/websites?select=*&limit=1000`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    })
    if (res.ok) {
      const data = await res.json()
      status.supabaseWebsites = Array.isArray(data) ? data.length : 0
    }
  } catch {}

  // External Firebase API is decommissioned
  status.api = 'decommissioned'

  return NextResponse.json(status)
}
