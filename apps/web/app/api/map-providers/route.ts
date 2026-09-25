import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '50'
    const category = searchParams.get('category')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ providers: [], total: 0 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase
      .from('providers')
      .select('id, business_name, logo_url, primary_category, city, state, address, latitude, longitude, is_verified, description')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(100)

    if (category) {
      query = query.ilike('primary_category', `%${category}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ providers: [], total: 0, debug: error.message }, { status: 200 })
    }

    let providers = (data || []).map((p: any) => ({
      id: p.id,
      name: p.business_name,
      service: p.primary_category || 'Service',
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      address: p.address || [p.city, p.state].filter(Boolean).join(', '),
      rating: 4.5,
      logo_url: p.logo_url || '',
      city: p.city || '',
      state: p.state || '',
      is_verified: p.is_verified || false,
      description: p.description || '',
    }))

    if (lat && lng) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      const maxRadius = parseFloat(radius)

      providers = providers
        .map((p: any) => {
          const R = 6371
          const dLat = ((p.lat - userLat) * Math.PI) / 180
          const dLng = ((p.lng - userLng) * Math.PI) / 180
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          p.distance = R * c
          return p
        })
        .filter((p: any) => p.distance <= maxRadius)
        .sort((a: any, b: any) => a.distance - b.distance)
    }

    return NextResponse.json({ providers, total: providers.length })
  } catch {
    return NextResponse.json({ providers: [], total: 0 })
  }
}
