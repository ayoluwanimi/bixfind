import type { MetadataRoute } from 'next'

export const revalidate = 3600

async function fetchAll(path: string, select: string): Promise<any[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return []
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    const out: any[] = []
    let from = 0
    // Supabase REST caps at 1000 rows — page through
    while (true) {
      const res = await fetch(`${url}/rest/v1/${path}?select=${select}&order=updated_at.desc&offset=${from}&limit=1000`, { headers, next: { revalidate: 3600 } })
      if (!res.ok) break
      const batch = await res.json()
      if (!Array.isArray(batch) || batch.length === 0) break
      out.push(...batch)
      if (batch.length < 1000) break
      from += 1000
    }
    return out
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = ['', '/search', '/about', '/contact', '/support'].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.6,
  }))

  // Published provider websites
  const sites = await fetchAll('mini_websites?is_published=eq.true', 'slug,updated_at')
  const siteEntries: MetadataRoute.Sitemap = sites
    .filter((s) => s.slug)
    .map((s) => ({
      url: `${base}/p/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))

  // Category/city landing pages
  const providers = await fetchAll('providers?is_verified=eq.true', 'primary_category,city,state')
  const combos = new Set<string>()
  for (const p of providers) {
    if (p.primary_category && p.city) {
      combos.add(`${slugify(p.primary_category)}/${slugify(p.city)}`)
    }
  }
  const landingEntries: MetadataRoute.Sitemap = Array.from(combos).slice(0, 500).map((c) => ({
    url: `${base}/c/${c}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Services detail pages (best-effort: map provider → published site slug)
  const mwAll = await fetchAll('mini_websites?is_published=eq.true', 'provider_id,slug')
  const providerSlugMap = new Map<string, string>(mwAll.filter((m: any) => m.provider_id && m.slug).map((m: any) => [m.provider_id, m.slug]))
  const services = await fetchAll('services?is_active=eq.true', 'id,provider_id,updated_at')
  const serviceEntries: MetadataRoute.Sitemap = services
    .map((s: any) => ({ s, slug: providerSlugMap.get(s.provider_id) }))
    .filter((x: any) => x.slug)
    .slice(0, 2000)
    .map((x: any) => ({
      url: `${base}/p/${x.slug}/services/${x.s.id}`,
      lastModified: x.s.updated_at ? new Date(x.s.updated_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

  return [...staticRoutes, ...siteEntries, ...landingEntries, ...serviceEntries]
}

function slugify(s: string): string {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
