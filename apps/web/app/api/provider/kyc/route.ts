import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json({ kyc_status: 'not_submitted' })
    }

    return NextResponse.json({
      kyc_status: data.kyc_status || 'not_submitted',
      kyc_full_name: data.kyc_full_name,
      kyc_dob: data.kyc_dob,
      kyc_phone: data.kyc_phone,
      kyc_address: data.kyc_address,
      kyc_city: data.kyc_city,
      kyc_state: data.kyc_state,
      kyc_country: data.kyc_country,
      kyc_id_type: data.kyc_id_type,
      kyc_id_number: data.kyc_id_number,
      kyc_id_document: data.kyc_id_document,
      kyc_selfie: data.kyc_selfie,
      kyc_nin_number: data.kyc_nin_number,
      kyc_reg_number: data.kyc_reg_number,
      kyc_business_address: data.kyc_business_address,
      kyc_tax_id: data.kyc_tax_id,
      kyc_utility_bill: data.kyc_utility_bill,
      kyc_business_name: data.kyc_business_name,
      kyc_rejection_reason: data.kyc_rejection_reason,
      kyc_verified_at: data.kyc_verified_at,
      kyc_submitted_at: data.kyc_submitted_at,
    })
  } catch {
    return NextResponse.json({ kyc_status: 'not_submitted' })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const now = new Date().toISOString()

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({
        kyc_status: 'pending',
        kyc_full_name: body.kyc_full_name || null,
        kyc_dob: body.kyc_dob || null,
        kyc_phone: body.kyc_phone || null,
        kyc_address: body.kyc_address || null,
        kyc_city: body.kyc_city || null,
        kyc_state: body.kyc_state || null,
        kyc_country: body.kyc_country || null,
        kyc_business_name: body.kyc_business_name || null,
        kyc_id_type: body.kyc_id_type || null,
        kyc_id_number: body.kyc_id_number || null,
        kyc_id_document: body.kyc_id_document || null,
        kyc_selfie: body.kyc_selfie || null,
        kyc_reg_number: body.kyc_reg_number || null,
        kyc_business_address: body.kyc_business_address || null,
        kyc_tax_id: body.kyc_tax_id || null,
        kyc_utility_bill: body.kyc_utility_bill || null,
        kyc_submitted_at: now,
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: `Failed to submit KYC: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, status: 'pending' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
