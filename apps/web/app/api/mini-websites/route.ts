import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

// ─── Validation ────────────────────────────────────────────────
const blockSchema = z.object({
  id: z.string().min(1).max(100),
  sectionId: z.string().min(1).max(50),
  content: z.record(z.string(), z.unknown()).default({}),
  visible: z.boolean().default(true),
})

const websitePayloadSchema = z.object({
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

/** Resolve the authenticated user from the Supabase session (server-side only). */
async function getSessionUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

// ─── GET: read draft or published site ─────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const mode = searchParams.get('mode') // 'draft' | 'published' | null

    // Public access: any published site by slug (no auth required)
    if (slug) {
      const admin = createAdminClient()
      const { data: site, error } = await admin
        .from('mini_websites')
        .select('*')
        .eq('slug', slug.toLowerCase().trim())
        .limit(1)
        .maybeSingle()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      return NextResponse.json(shapeSite(site, mode === 'draft'))
    }

    // Owner access: draft/latest for the signed-in user (auth required)
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mini_websites')
      .select('*')
      .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const site = data?.[0]
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(shapeSite(site, mode !== 'published'))
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch website' }, { status: 500 })
  }
}

/** Map DB row to the camelCase shape the builder expects. */
function shapeSite(site: any, preferDraft: boolean) {
  const parseJson = (val: any) => {
    if (!val) return null
    if (typeof val === 'string') { try { return JSON.parse(val) } catch { return null } }
    return val
  }

  const hasDraft = !!(site.draft_blocks && parseJson(site.draft_blocks)?.length)
  const useDraft = preferDraft && hasDraft

  return {
    id: site.id,
    slug: site.slug || '',
    is_published: !!site.is_published,
    providerId: site.provider_id || site.user_id || '',
    blocks: useDraft
      ? parseJson(site.draft_blocks) || parseJson(site.blocks) || []
      : parseJson(site.blocks) || [],
    templateId: (useDraft ? site.draft_template_id : site.template_id) || site.template_id || 'minimal',
    paletteId: (useDraft ? site.draft_palette_id : site.palette_id) || site.palette_id || 'ocean',
    fontPairId: (useDraft ? site.draft_font_pair_id : site.font_pair_id) || site.font_pair_id || 'modern-sans',
    density: (useDraft ? site.draft_density : site.density) || site.density || 'comfortable',
    customColors: parseJson(useDraft ? site.draft_custom_colors : site.custom_colors) ?? parseJson(site.custom_colors) ?? null,
    logoUrl: (useDraft ? site.draft_logo_url : site.logo_url) || site.logo_url || '',
    hasUnpublishedChanges: hasDraft,
    whatsappEnabled: !!site.whatsapp_enabled,
    whatsappNumber: site.whatsapp_number || '',
    footerBusinessName: site.footer_business_name || '',
    footerTagline: site.footer_tagline || '',
    footerShowSocial: site.footer_show_social !== false,
    footerShowPoweredBy: site.footer_show_powered_by !== false,
    socialFacebook: site.social_facebook || '',
    socialInstagram: site.social_instagram || '',
    socialTwitter: site.social_twitter || '',
    socialTiktok: site.social_tiktok || '',
    socialLinkedin: site.social_linkedin || '',
    socialYoutube: site.social_youtube || '',
    legacy: {
      hero_title: site.hero_title || '',
      hero_tagline: site.hero_tagline || site.tagline || '',
      bio: site.bio || '',
      services: parseJson(site.services) || [],
      phone: site.phone || '',
      email: site.email || '',
      address: site.address || '',
    },
  }
}

// ─── POST: save draft (published site is NEVER touched here) ───
export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized — sign in to save your website' }, { status: 401 })

    const raw = await request.json()
    const parsed = websitePayloadSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', detail: parsed.error.issues.slice(0, 5) }, { status: 400 })
    }
    const d = parsed.data

    const admin = createAdminClient()
    const now = new Date().toISOString()

    // Find the provider's row by user_id OR provider_id (never create cross-user collisions)
    const { data: existing } = await admin
      .from('mini_websites')
      .select('id, is_published, user_id, provider_id, blocks')
      .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
      .limit(1)

    const draftColumns: Record<string, any> = {
      draft_blocks: JSON.stringify(d.blocks),
      draft_template_id: d.templateId ?? null,
      draft_palette_id: d.paletteId ?? null,
      draft_font_pair_id: d.fontPairId ?? null,
      draft_density: d.density ?? null,
      draft_custom_colors: d.customColors ? JSON.stringify(d.customColors) : null,
      draft_logo_url: d.logoUrl || null,
      // Settings are safe to persist directly: they only matter at publish time
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
      updated_at: now,
    }

    if (existing && existing.length > 0) {
      const row = existing[0]
      const updateData: Record<string, any> = { ...draftColumns }

      // Claim the row: set user_id/provider_id if it was created by someone else
      // (only when the row has no owner yet — this fixes legacy 'anonymous' rows)
      if (!row.user_id || row.user_id === 'anonymous') updateData.user_id = userId
      if (!row.provider_id) updateData.provider_id = userId

      // Data-preserving backfill: if the published site has empty blocks but legacy
      // content exists (hero_title, bio, services…), seed the draft from legacy
      // columns so the provider never sees an empty editor and nothing is lost.
      const publishedBlocks = parseBlocks(row.blocks)
      const { data: legacy } = await admin
        .from('mini_websites')
        .select('hero_title, hero_tagline, tagline, bio, services, phone, email, address, title')
        .eq('id', row.id)
        .single()

      if (publishedBlocks.length === 0 && legacy) {
        updateData.draft_blocks = JSON.stringify(buildLegacyBlocks(legacy))
      }

      const { error } = await admin.from('mini_websites').update(updateData).eq('id', row.id)
      if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 })
      return NextResponse.json({ success: true, id: row.id })
    }

    // First save: create a draft row owned by this user
    const { data: legacyRow } = await admin
      .from('mini_websites')
      .select('hero_title, hero_tagline, tagline, bio, services, phone, email, address, title, blocks, slug, is_published, published_at')
      .eq('provider_id', userId)
      .maybeSingle()

    const createData: Record<string, any> = {
      user_id: userId,
      provider_id: userId,
      created_at: now,
      is_published: false,
      ...draftColumns,
    }

    if (legacyRow) {
      // Adopt the pre-existing legacy row instead of creating a duplicate
      createData.slug = legacyRow.slug || undefined
      createData.is_published = !!legacyRow.is_published
      createData.published_at = legacyRow.published_at || null
      createData.blocks = legacyRow.blocks || JSON.stringify([])
      const publishedBlocks = parseBlocks(legacyRow.blocks)
      if (publishedBlocks.length === 0) {
        createData.draft_blocks = JSON.stringify(buildLegacyBlocks(legacyRow))
      }
      const { data: created, error } = await admin
        .from('mini_websites')
        .update(createData)
        .eq('provider_id', userId)
        .select('id')
        .single()
      if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 })
      return NextResponse.json({ success: true, id: created.id })
    }

    const { data: created, error } = await insertSiteIgnoringBadOwner(admin, createData)

    if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 })
    return NextResponse.json({ success: true, id: created.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function parseBlocks(blocks: any): any[] {
  if (!blocks) return []
  if (typeof blocks === 'string') { try { const p = JSON.parse(blocks); return Array.isArray(p) ? p : [] } catch { return [] } }
  return Array.isArray(blocks) ? blocks : []
}

/**
 * Insert a new site row. If the FK on provider_id rejects the insert (user has
 * no providers row yet), retry once without it so the draft is never lost.
 */
async function insertSiteIgnoringBadOwner(admin: any, createData: Record<string, any>) {
  const first = await admin.from('mini_websites').insert(createData).select('id').single()
  if (!first.error) return first
  const msg = String(first.error.message || '')
  if (msg.includes('provider_id') || msg.includes('provider_id_fkey') || first.error.code === '23503') {
    const retryData = { ...createData }
    delete retryData.provider_id
    return admin.from('mini_websites').insert(retryData).select('id').single()
  }
  return first
}

/**
 * Build a valid blocks array from the legacy flat columns.
 * Used ONLY to seed the draft — never overwrites published blocks.
 */
function buildLegacyBlocks(legacy: any): any[] {
  const ts = Date.now()
  const heroTitle = legacy.hero_title || legacy.title || legacy.tagline || ''
  const heroTagline = legacy.hero_tagline || legacy.tagline || ''
  const services = Array.isArray(legacy.services) ? legacy.services : []

  return [
    {
      id: `hero-${ts}`,
      sectionId: 'hero',
      visible: true,
      content: { title: heroTitle, tagline: heroTagline, ctaText: legacy.phone ? 'Contact Us' : 'Get Started', ctaLink: legacy.phone ? `tel:${legacy.phone}` : '#', backgroundType: 'color', backgroundImage: '' },
    },
    {
      id: `about-${ts}`,
      sectionId: 'about',
      visible: true,
      content: { content: legacy.bio || '', image: '' },
    },
    {
      id: `services-${ts}`,
      sectionId: 'services',
      visible: true,
      content: {
        services: services.slice(0, 12).map((s: any) => ({
          title: s.title || s.name || 'Service',
          description: s.description || '',
          ...(s.price != null ? { price: Number(s.price) } : {}),
        })),
      },
    },
    {
      id: `contact-${ts}`,
      sectionId: 'contact',
      visible: true,
      content: { email: legacy.email || '', phone: legacy.phone || '', address: legacy.address || '', formEnabled: true },
    },
  ]
}
