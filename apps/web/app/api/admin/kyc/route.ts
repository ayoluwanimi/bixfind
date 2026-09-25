import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const meta = user.user_metadata
  if (meta?.user_type !== 'admin') return null
  return { user, supabase }
}

function validateNIN(nin: string): { valid: boolean; reason?: string } {
  const cleaned = nin.replace(/[\s-]/g, '')
  if (!/^\d{11}$/.test(cleaned)) {
    return { valid: false, reason: 'NIN must be exactly 11 digits' }
  }
  const weightedSum = cleaned.split('').reduce((sum, digit, i) => {
    const d = parseInt(digit, 10)
    if (i < 10) return sum + d * (11 - i)
    return sum
  }, 0)
  const remainder = weightedSum % 11
  const checkDigit = remainder < 2 ? 0 : 11 - remainder
  if (parseInt(cleaned[10], 10) !== checkDigit) {
    return { valid: false, reason: 'NIN checksum verification failed — invalid number' }
  }
  return { valid: true }
}

function validateIDNumber(idType: string, idNumber: string): { valid: boolean; reason?: string } {
  const cleaned = idNumber.replace(/[\s-]/g, '')
  switch (idType) {
    case 'national_id':
    case 'nin':
      return validateNIN(cleaned)
    case 'passport':
      if (!/^[A-Z]\d{8}$/i.test(cleaned) && !/^[A-Z]{2}\d{7}$/i.test(cleaned)) {
        return { valid: false, reason: 'Passport format: 1 letter + 8 digits or 2 letters + 7 digits' }
      }
      return { valid: true }
    case 'drivers_license':
      if (!/^[A-Z]{3}\d{8,12}$/i.test(cleaned) && !/^\d{8,14}$/.test(cleaned)) {
        return { valid: false, reason: 'Driver license format: 3 letters + 8-12 digits or 8-14 digits' }
      }
      return { valid: true }
    case 'voters_card':
      if (!/^[A-Z\/\d]{10,20}$/i.test(cleaned)) {
        return { valid: false, reason: 'Voter card must be 10-20 alphanumeric characters' }
      }
      return { valid: true }
    default:
      return { valid: true }
  }
}

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const status = searchParams.get('status')
  const action = searchParams.get('action')

  const admin = createAdminClient()

  if (action === 'validate_nin') {
    const nin = searchParams.get('nin') || ''
    const result = validateNIN(nin)
    return NextResponse.json(result)
  }

  if (action === 'validate_id') {
    const idType = searchParams.get('id_type') || ''
    const idNumber = searchParams.get('id_number') || ''
    const result = validateIDNumber(idType, idNumber)
    return NextResponse.json(result)
  }

  let query = admin.from('users').select('*').order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('id', userId)
  } else if (status) {
    query = query.eq('kyc_status', status)
  } else {
    query = query.neq('kyc_status', 'not_submitted')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    kyc_status: u.kyc_status || 'not_submitted',
    kyc_full_name: u.kyc_full_name,
    kyc_dob: u.kyc_dob,
    kyc_phone: u.kyc_phone,
    kyc_address: u.kyc_address,
    kyc_city: u.kyc_city,
    kyc_state: u.kyc_state,
    kyc_country: u.kyc_country,
    kyc_id_type: u.kyc_id_type,
    kyc_id_number: u.kyc_id_number,
    kyc_id_document: u.kyc_id_document,
    kyc_selfie: u.kyc_selfie,
    kyc_nin_number: u.kyc_nin_number,
    kyc_nin_verified: u.kyc_nin_verified,
    kyc_other_id_type: u.kyc_other_id_type,
    kyc_other_id_number: u.kyc_other_id_number,
    kyc_other_id_document: u.kyc_other_id_document,
    kyc_business_name: u.kyc_business_name,
    kyc_reg_number: u.kyc_reg_number,
    kyc_business_address: u.kyc_business_address,
    kyc_tax_id: u.kyc_tax_id,
    kyc_utility_bill: u.kyc_utility_bill,
    kyc_rejection_reason: u.kyc_rejection_reason,
    kyc_verified_at: u.kyc_verified_at,
    kyc_submitted_at: u.kyc_submitted_at,
  }))

  return NextResponse.json({ success: true, data: users, count: users.length })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { user_id, action: act, rejection_reason, kyc_status: newStatus } = body

  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const admin = createAdminClient()
  const now = new Date().toISOString()

  if (act === 'verify') {
    const nin = body.kyc_nin_number
    let ninVerified = false
    if (nin) {
      const ninResult = validateNIN(nin)
      ninVerified = ninResult.valid
    }

    const idType = body.kyc_id_type
    const idNumber = body.kyc_id_number
    let idValid = true
    if (idType && idNumber) {
      const idResult = validateIDNumber(idType, idNumber)
      idValid = idResult.valid
    }

    if (nin && !ninVerified) {
      return NextResponse.json({ error: 'NIN verification failed — invalid NIN number' }, { status: 400 })
    }
    if (!idValid) {
      return NextResponse.json({ error: `ID verification failed: invalid ${idType} number` }, { status: 400 })
    }

    const { error } = await admin.from('users').update({
      kyc_status: 'verified',
      kyc_nin_verified: ninVerified,
      kyc_verified_at: now,
      kyc_rejection_reason: null,
      is_verified: true,
      updated_at: now,
    }).eq('id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, kyc_status: 'verified', nin_verified: ninVerified })
  }

  if (act === 'reject') {
    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }
    const { error } = await admin.from('users').update({
      kyc_status: 'rejected',
      kyc_rejection_reason: rejection_reason,
      updated_at: now,
    }).eq('id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, kyc_status: 'rejected' })
  }

  if (act === 'update_status') {
    const { error } = await admin.from('users').update({
      kyc_status: newStatus || 'not_submitted',
      updated_at: now,
    }).eq('id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, kyc_status: newStatus })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
