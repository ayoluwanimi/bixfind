import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export default async function ProfileSiteSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Keep the legacy data source as a fallback so old links never dead-end,
  // even if the canonical page was never published.
  let published = false
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('mini_websites')
      .select('is_published')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle()
    published = !!data?.is_published
  } catch {
    published = false
  }

  if (published) {
    // Canonical home for published provider sites
    redirect(`/p/${encodeURIComponent(slug)}`)
  }

  // Unpublished / unknown slug — send visitors to search instead of a 404
  redirect('/search')
}
