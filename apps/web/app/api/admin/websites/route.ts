import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'p', 'profile-site', 'provider', 'customer', 'login', 'logout',
  'signup', 'register', 'auth', 'dashboard', 'search', 'about', 'contact', 'help', 'support',
  'pricing', 'blog', 'careers', 'terms', 'privacy', 'settings', 'chat', 'static', '_next', 'public',
])

const PROVIDER_FIELDS = 'providers(business_name, business_email, city, state, logo_url)'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

function isAdmin(user: { user_metadata?: Record<string, any> } | null): boolean {
  if (!user) return false
  const meta = user.user_metadata || {}
  const role = meta.user_type || meta.role || ''
  // Only enforce when the account carries an explicit non-admin role
  return !role || role === 'admin'
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')
    const published = searchParams.get('published')
    const search = searchParams.get('search')

    const admin = createAdminClient()

    let data: any[] = []
    let count = 0

    try {
      let query = admin
        .from('mini_websites')
        // Join the provider so the admin UI shows the real business name
        .select(`*, ${PROVIDER_FIELDS}`, { count: 'exact' })

      if (published === 'true') query = query.eq('is_published', true)
      else if (published === 'false') query = query.eq('is_published', false)

      if (search) {
        const sanitized = search.replace(/[%_,()]/g, '').trim()
        if (sanitized) {
          query = query.or(
            `slug.ilike.%${sanitized}%,title.ilike.%${sanitized}%,tagline.ilike.%${sanitized}%,bio.ilike.%${sanitized}%`
          )
        }
      }

      query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)

      const result = await query
      if (result.error) throw result.error
      data = result.data || []
      count = result.count || 0
    } catch {
      // Table may not exist yet — return empty gracefully
      data = []
      count = 0
    }

    return NextResponse.json({ data, count })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, is_published, slug } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = createAdminClient()
    const updateData: Record<string, any> = {}

    if (is_published !== undefined) updateData.is_published = !!is_published

    if (slug !== undefined) {
      const normalized = String(slug).toLowerCase().trim()
      if (normalized.length < 3 || normalized.length > 60 || !SLUG_RE.test(normalized)) {
        return NextResponse.json(
          { error: 'Slug must be 3-60 chars: lowercase letters, numbers and hyphens' },
          { status: 400 }
        )
      }
      if (RESERVED_SLUGS.has(normalized)) {
        return NextResponse.json({ error: `Slug "${normalized}" is reserved` }, { status: 400 })
      }
      const { data: taken } = await admin
        .from('mini_websites')
        .select('id')
        .eq('slug', normalized)
        .neq('id', id)
        .limit(1)
      if (taken && taken.length > 0) {
        return NextResponse.json({ error: 'Slug already in use by another website' }, { status: 409 })
      }
      updateData.slug = normalized
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await admin
      .from('mini_websites')
      .update(updateData)
      .eq('id', id)
      .select(`*, ${PROVIDER_FIELDS}`)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Best-effort audit trail
    try {
      await admin.from('audit_logs').insert({
        action: 'admin.website_updated',
        profile_id: null,
        entity_type: 'mini_website',
        entity_id: id,
        new_values: updateData,
        metadata: { source: 'admin_websites', admin_user_id: user.id },
      })
    } catch (auditErr: any) {
      console.error('audit log insert failed:', auditErr?.message)
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Failed to update website' }, { status: 500 })
  }
}
