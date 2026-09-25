import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ providers: [] })
    }

    const headers: Record<string, string> = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }

    const fpRes = await fetch(
      `${supabaseUrl}/rest/v1/featured_providers?select=*&order=featured_at.desc`,
      { headers }
    )

    if (!fpRes.ok) return NextResponse.json({ providers: [] })
    const featuredData = await fpRes.json()
    const featured = featuredData || []

    if (featured.length === 0) return NextResponse.json({ providers: [] })

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const uuidIds = featured
      .map((f: any) => f.provider_id)
      .filter((id: string) => id && uuidPattern.test(id))

    let providerMap = new Map<string, any>()
    let websiteMap = new Map<string, any>()

    if (uuidIds.length > 0) {
      const idList = uuidIds.join(',')
      const provRes = await fetch(
        `${supabaseUrl}/rest/v1/providers?select=id,business_name,business_phone,logo_url,primary_category,city,state,description,address,is_verified,tier&id=in.(${idList})`,
        { headers }
      )
      if (provRes.ok) {
        const provData = await provRes.json()
        if (Array.isArray(provData)) {
          provData.forEach((p: any) => providerMap.set(p.id, p))
        }
      }

      const mwRes = await fetch(
        `${supabaseUrl}/rest/v1/mini_websites?select=provider_id,slug,logo_url&provider_id=in.(${idList})`,
        { headers }
      )
      if (mwRes.ok) {
        const websites = await mwRes.json()
        if (Array.isArray(websites)) {
          websites.forEach((w: any) => websiteMap.set(w.provider_id, w))
        }
      }
    }

    const providers = featured.map((f: any) => {
      const prov = providerMap.get(f.provider_id) || {}
      const mw = websiteMap.get(f.provider_id) || {}

      const businessName = f.business_name || prov.business_name || 'Provider'
      // Only expose a real website slug — never a fabricated one that 404s
      const slug = mw.slug || ''
      const logoUrl = f.logo_url || mw.logo_url || prov.logo_url || ''

      return {
        id: f.provider_id || f.id,
        name: businessName,
        service: f.primary_category || prov.primary_category || '',
        tagline: f.description || prov.description || '',
        logoUrl,
        slug,
        phone: prov.business_phone || '',
        city: f.city || prov.city || '',
        state: f.state || prov.state || '',
        address: prov.address || '',
        rating: 0,
        reviews: 0,
        hasWebsite: !!slug,
        isVerified: prov.is_verified || false,
        tier: prov.tier || '',
      }
    })

    return NextResponse.json({ providers })
  } catch {
    return NextResponse.json({ providers: [] })
  }
}
