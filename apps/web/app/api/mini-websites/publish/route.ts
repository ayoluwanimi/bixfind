import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const blockSchema = z.object({
  id: z.string().min(1).max(100),
  sectionId: z.string().min(1).max(50),
  content: z.record(z.string(), z.unknown()).default({}),
  visible: z.boolean().default(true),
})

const publishPayloadSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(60, 'Slug must be at most 60 characters')
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Only lowercase letters, numbers and hyphens'),
  blocks: z.array(blockSchema).max(50).default([]),
  templateId: z.string().max(60).optional(),
  paletteId: z.string().max(60).optional(),
  fontPairId: z.string().max(60).optional(),
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  customColors: z
    .object({
      primary: z.string().max(40),
      background: z.string().max(40),
      accent: z.string().max(40),
    })
    .nullable()
    .optional(),
  logoUrl: z.string().max(2048).optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappNumber: z.string().max(30).optional(),
  footerBusinessName: z.string().max(120).optional(),
  footerTagline: z.string().max(200).optional(),
  footerShowSocial: z.boolean().optional(),
  footerShowPoweredBy: z.boolean().optional(),
  socialFacebook: z.string().max(500).optional(),
  socialInstagram: z.string().max(500).optional(),
  socialTwitter: z.string().max(500).optional(),
  socialTiktok: z.string().max(500).optional(),
  socialLinkedin: z.string().max(500).optional(),
  socialYoutube: z.string().max(500).optional(),
})

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'signup', 'dashboard', 'provider', 'profile-site',
  'about', 'contact', 'support', 'chat', 'search', 'bookings', 'wallet',
  'favorites', 'settings', 'p', 'forgot-password', 'verify', 'how-it-works',
])

/** Server-side session identity — the request body can never claim another user. */
async function getSessionUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized — sign in to publish' }, { status: 401 })

    const raw = await request.json()
    const parsed = publishPayloadSchema.safeParse(raw)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json({ error: first?.message || 'Invalid payload' }, { status: 400 })
    }
    const d = parsed.data
    const slug = d.slug

    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ error: 'This slug is reserved' }, { status: 409 })
    }

    const admin = createAdminClient()
    const now = new Date().toISOString()

    // Slug uniqueness (case-insensitive), excluding this user's own row
    const { data: slugOwner } = await admin
      .from('mini_websites')
      .select('id, user_id, provider_id')
      .eq('slug', slug)
      .limit(1)

    const ownsRow = (row: any) => row && (row.user_id === userId || row.provider_id === userId)
    if (slugOwner && slugOwner.length > 0 && !ownsRow(slugOwner[0])) {
      return NextResponse.json({ error: 'This slug is already taken' }, { status: 409 })
    }

    const publishedData: Record<string, any> = {
      blocks: JSON.stringify(d.blocks),
      template_id: d.templateId || 'minimal',
      palette_id: d.paletteId || 'ocean',
      font_pair_id: d.fontPairId || 'modern-sans',
      density: d.density || 'comfortable',
      custom_colors: d.customColors ? JSON.stringify(d.customColors) : null,
      logo_url: d.logoUrl || null,
      is_published: true,
      published_at: now,
      updated_at: now,
      whatsapp_enabled: d.whatsappEnabled ?? false,
      whatsapp_number: d.whatsappNumber || null,
      footer_business_name: d.footerBusinessName || null,
      footer_tagline: d.footerTagline || null,
      footer_show_social: d.footerShowSocial ?? true,
      footer_show_powered_by: d.footerShowPoweredBy ?? true,
      social_facebook: d.socialFacebook || null,
      social_instagram: d.socialInstagram || null,
      social_twitter: d.socialTwitter || null,
      social_tiktok: d.socialTiktok || null,
      social_linkedin: d.socialLinkedin || null,
      social_youtube: d.socialYoutube || null,
      // Clear the draft — published content now matches it exactly
      draft_blocks: null,
      draft_template_id: null,
      draft_palette_id: null,
      draft_font_pair_id: null,
      draft_density: null,
      draft_custom_colors: null,
      draft_logo_url: null,
      slug,
      user_id: userId,
      provider_id: userId,
    }

    const { data: existingSite } = await admin
      .from('mini_websites')
      .select('id')
      .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
      .limit(1)

    if (existingSite && existingSite.length > 0) {
      const { error } = await admin
        .from('mini_websites')
        .update(publishedData)
        .eq('id', existingSite[0].id)

      if (error) return NextResponse.json({ error: `Publish failed: ${error.message}` }, { status: 500 })
      await audit(admin, userId, 'website_published', slug)
      return NextResponse.json({ success: true, slug, url: `/p/${slug}` })
    }

    publishedData.created_at = now
    const { data: created, error } = await admin
      .from('mini_websites')
      .insert(publishedData)
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: `Publish failed: ${error.message}` }, { status: 500 })
    await audit(admin, userId, 'website_published', slug)
    return NextResponse.json({ success: true, slug, url: `/p/${slug}`, id: created.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function audit(admin: any, userId: string, action: string, detail: string) {
  try {
    await admin.from('audit_logs').insert({
      action,
      profile_id: userId,
      details: detail,
      created_at: new Date().toISOString(),
    })
  } catch {
    // audit table may have different columns — never fail the publish for this
  }
}
