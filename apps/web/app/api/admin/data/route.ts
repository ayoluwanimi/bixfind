import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const meta = user.user_metadata
  const userType = meta?.user_type || meta?.role || ''
  if (userType !== 'admin') return null
  return { user, supabase }
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { email, fullName, name, phone, userType, role, password, id } = body

    if (!email || (!fullName && !name)) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'User already exists', user: existing })
    }

    // Create in Supabase Auth first so user can log in
    let authUserId: string | null = null
    if (password) {
      const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || name,
          phone: phone || '',
          role: role || userType || 'user',
          user_type: role || userType || 'user',
        },
      })
      if (!authErr && authUser?.user) {
        authUserId = authUser.user.id
      }
    }

    const userId = id || authUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const userData = {
      id: userId,
      email: normalizedEmail,
      name: fullName || name,
      phone: phone || '',
      role: role || userType || 'user',
      is_verified: true,
      is_active: true,
      is_suspended: false,
      wallet: JSON.stringify({ balance: 0 }),
      created_at: now,
      updated_at: now,
    }

    const { error: insertError } = await admin.from('users').insert(userData)

    if (!insertError) {
      return NextResponse.json({
        success: true,
        user: { id: userId, email: normalizedEmail, name: userData.name, role: userData.role },
      })
    }

    return NextResponse.json({ error: `Insert failed: ${insertError.message.substring(0, 200)}` }, { status: 500 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { action, id, email, isSuspended } = body

    if (!id && !email) {
      return NextResponse.json({ error: 'User ID or email required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const now = new Date().toISOString()

    // Suspend / Unsuspend
    if (action === 'suspend' || action === 'unsuspend') {
      const suspended = action === 'suspend'
      const query = admin.from('users').update({
        is_suspended: suspended,
        is_active: !suspended,
        updated_at: now,
      })
      if (id) query.eq('id', id)
      else query.eq('email', email!.toLowerCase().trim())

      const { error } = await query
      if (error) {
        return NextResponse.json({ error: `Failed to ${action}: ${error.message}` }, { status: 500 })
      }
      return NextResponse.json({ success: true, action, id, isSuspended: suspended })
    }

    // Toggle suspend (flip current state)
    if (action === 'toggle_suspend') {
      const query = admin.from('users').select('is_suspended')
      if (id) query.eq('id', id)
      else query.eq('email', email!.toLowerCase().trim())
      query.limit(1)

      const { data: rawUsers, error: fetchErr } = await query
      if (fetchErr || !rawUsers || rawUsers.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      const target = rawUsers as any[]

      const wasSuspended = !!target[0].is_suspended
      const { error: updateErr } = await admin
        .from('users')
        .update({ is_suspended: !wasSuspended, is_active: wasSuspended, updated_at: now })
        .eq('id', target[0].id)

      if (updateErr) {
        return NextResponse.json({ error: `Failed to toggle suspend: ${updateErr.message}` }, { status: 500 })
      }
      return NextResponse.json({ success: true, action: wasSuspended ? 'unsuspend' : 'suspend', id: target[0].id, isSuspended: !wasSuspended })
    }

    // Reset password
    if (action === 'reset_password') {
      const { newPassword } = body
      if (!newPassword) {
        return NextResponse.json({ error: 'New password is required' }, { status: 400 })
      }

      let targetId = id
      if (!targetId && email) {
        const { data: users } = await admin.from('users').select('id').eq('email', email.toLowerCase().trim()).limit(1)
        if (users && users.length > 0) targetId = users[0].id
      }

      if (!targetId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Use Supabase Auth to reset password (not our hashed column)
      const { error: authErr } = await admin.auth.admin.updateUserById(targetId, { password: newPassword })
      if (authErr) {
        return NextResponse.json({ error: `Auth password reset failed: ${authErr.message}` }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Password updated' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'users'

    const admin = createAdminClient()

    if (type === 'websites') {
      const { data: raw } = await admin
        .from('mini_websites')
        .select('*')
        .order('created_at', { ascending: false })

      const data = Array.isArray(raw) ? raw : []
      const mapped = data.map((w: any) => ({
        id: w.id,
        userId: w.user_id || '',
        companyName: w.company_name || w.title || '',
        displayName: w.display_name || w.title || '',
        heroTitle: w.hero_title || '',
        tagline: w.tagline || '',
        category: w.category || '',
        services: typeof w.services === 'string' ? JSON.parse(w.services || '[]') : w.services || [],
        phone: w.phone || '',
        email: w.email || '',
        address: w.address || '',
        logoUrl: w.logo_url || '',
        bannerUrl: w.banner_url || '',
        isPublished: w.is_published !== false,
        createdAt: w.created_at || new Date().toISOString(),
        updatedAt: w.updated_at || new Date().toISOString()
      }))

      return NextResponse.json({ success: true, data: mapped, count: mapped.length })
    }

    if (type === 'activities') {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    // Default: fetch users from profiles + providers
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: provList } = await admin
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (profErr) {
      return NextResponse.json({ success: false, data: [], count: 0 })
    }

    const provMap = new Map<string, any>()
    ;(provList || []).forEach((p: any) => provMap.set(p.id, p))

    const data = Array.isArray(profiles) ? profiles : []
    const mapped = data.map((u: any) => {
      const prov = provMap.get(u.id)
      const isProvider = !!prov || u.role === 'provider'
      return {
        id: u.id,
        email: u.email || '',
        fullName: u.full_name || '',
        userType: isProvider ? 'provider' : 'user',
        phone: u.phone || '',
        isVerified: prov?.is_verified !== false,
        isActive: u.status === 'ACTIVE',
        isSuspended: u.status === 'SUSPENDED',
        wallet: { balance: 0 },
        createdAt: u.created_at || new Date().toISOString(),
        updatedAt: u.updated_at || new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true, data: mapped, count: mapped.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { type, id, email } = body

    if (!id && !email) {
      return NextResponse.json({ error: 'ID or email required' }, { status: 400 })
    }

    const targetId = id || email
    const table = type === 'websites' ? 'websites' : 'users'
    const admin = createAdminClient()

    // Delete from public.users (or websites)
    let delQuery
    if (id) {
      delQuery = admin.from(table).delete().eq('id', id)
    } else if (email) {
      delQuery = admin.from(table).delete().eq('email', email.toLowerCase().trim())
    } else {
      return NextResponse.json({ error: 'ID or email required' }, { status: 400 })
    }

    const { error: deleteError } = await delQuery

    if (deleteError) {
      return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 })
    }

    // Also try to remove from Auth (only for users table with UUID id)
    if (table === 'users' && id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const { error: authDeleteErr } = await admin.auth.admin.deleteUser(id)
      if (authDeleteErr) {
        console.warn('Auth user deletion failed (may not exist in Auth):', authDeleteErr.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 500 })
  }
}
