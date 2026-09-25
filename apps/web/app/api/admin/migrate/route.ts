import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MIGRATION_SQL = [
  // KYC columns for users
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'not_submitted'",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_full_name text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_dob text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_phone text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_address text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_city text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_state text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_country text DEFAULT 'Nigeria'",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_type text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_number text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_document text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_selfie text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_nin_number text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_nin_verified boolean DEFAULT false",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_other_id_type text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_other_id_number text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_other_id_document text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_business_name text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reg_number text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_business_address text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_tax_id text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_utility_bill text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz",
  // WhatsApp and footer columns for mini_websites
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS whatsapp_number text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS footer_business_name text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS footer_tagline text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS footer_show_social boolean DEFAULT true",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS footer_show_powered_by boolean DEFAULT true",
  // Social media columns for mini_websites
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_facebook text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_instagram text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_twitter text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_tiktok text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_linkedin text",
  "ALTER TABLE mini_websites ADD COLUMN IF NOT EXISTS social_youtube text",
]

export async function POST() {
  try {
    const admin = createAdminClient()
    const results: { sql: string; ok: boolean; error?: string }[] = []

    for (const sql of MIGRATION_SQL) {
      const { error } = await (async () => {
        try {
          await admin.rpc('exec', { sql }).single()
          return { error: null }
        } catch (e: any) {
          return { error: e?.message || String(e) }
        }
      })()
      if (error) {
        // Try using raw SQL via the admin client's pool
        results.push({ sql: sql.substring(0, 80), ok: false, error })
      } else {
        results.push({ sql: sql.substring(0, 80), ok: true })
      }
    }

    const successCount = results.filter(r => r.ok).length
    const failCount = results.filter(r => !r.ok).length

    return NextResponse.json({
      message: `Migration complete: ${successCount} succeeded, ${failCount} failed`,
      results,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
