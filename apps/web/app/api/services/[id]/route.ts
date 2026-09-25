import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ data: null, error: error?.message || 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ data: null }, { status: 500 })
  }
}
