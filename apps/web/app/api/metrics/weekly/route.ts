import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Weekly growth metrics for the admin overview.
 * Every value is real — when a table/count is unavailable it reports 0
 * rather than a fabricated placeholder.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const meta = user.user_metadata || {}
    const role = meta.user_type || meta.role || ''
    if (role && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

    const count = async (table: string, filters: Record<string, any> = {}, since = false) => {
      try {
        let q = admin.from(table).select('*', { count: 'exact', head: true })
        for (const [col, val] of Object.entries(filters)) q = q.eq(col, val)
        if (since) q = q.gte('created_at', weekAgo)
        const { count, error } = await q
        return error ? 0 : (count ?? 0)
      } catch {
        return 0
      }
    }

    const [
      publishedSites,
      draftSites,
      newSitesThisWeek,
      totalProviders,
      reviewsThisWeek,
      bookingsThisWeek,
    ] = await Promise.all([
      count('mini_websites', { is_published: true }),
      count('mini_websites', { is_published: false }),
      count('mini_websites', {}, true),
      count('providers'),
      count('reviews', {}, true),
      count('bookings', {}, true),
    ])

    return NextResponse.json({
      weekOf: new Date().toISOString().slice(0, 10),
      websites: { published: publishedSites, drafts: draftSites, newThisWeek: newSitesThisWeek },
      providers: { total: totalProviders },
      engagement: { reviewsThisWeek, bookingsThisWeek },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })
  }
}
