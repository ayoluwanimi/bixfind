import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = createAdminClient()

    // Count total users from profiles
    const { count: totalUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Count service providers from providers table
    const { count: totalProviders } = await admin
      .from('providers')
      .select('*', { count: 'exact', head: true })

    // Count distinct service categories
    const { data: services } = await admin
      .from('services')
      .select('category')
      .not('category', 'is', null)
      .not('category', 'eq', '')

    const totalCategories = new Set((services || []).map((s: any) => s.category)).size

    // Compute average rating from reviews
    const { data: reviews } = await admin
      .from('reviews')
      .select('rating')
      .not('rating', 'is', null)

    let avgRating = '4.9'
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0)
      avgRating = (sum / reviews.length).toFixed(1)
    }

    return NextResponse.json({
      users: totalUsers || 0,
      providers: totalProviders || 0,
      categories: totalCategories || 0,
      rating: avgRating,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ users: 0, providers: 0, categories: 0, rating: '0.0' })
  }
}
