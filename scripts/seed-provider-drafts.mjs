#!/usr/bin/env node
/**
 * One-time seed: pre-fill every provider's website DRAFT from their legacy
 * columns so they open the builder to a ready-made site.
 *
 * Safety: only touches rows where published `blocks` is empty/missing, and
 * only writes draft_blocks/draft_* columns. Published content is never
 * modified. Re-running is a no-op for rows that already have drafts.
 *
 * Usage: node scripts/seed-provider-drafts.mjs
 * Env:   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL)
 */
import { createRequire } from 'node:module'
// Resolve @supabase/supabase-js from the web app's dependencies
const require = createRequire(new URL('../apps/web/package.json', import.meta.url))
const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

function buildLegacyBlocks(row) {
  const ts = Date.now()
  const services = Array.isArray(row.services) ? row.services : []
  const heroTitle = row.hero_title || row.title || row.slug || ''
  const heroTagline = row.hero_tagline || row.tagline || ''
  const phone = row.phone || ''

  const blocks = [
    {
      id: `hero-${ts}`,
      sectionId: 'hero',
      visible: true,
      content: {
        title: heroTitle,
        tagline: heroTagline,
        ctaText: phone ? 'Contact Us' : 'Get Started',
        ctaLink: phone ? `tel:${phone}` : '#',
        backgroundType: 'color',
        backgroundImage: '',
      },
    },
  ]
  if (row.bio) {
    blocks.push({ id: `about-${ts}`, sectionId: 'about', visible: true, content: { content: row.bio, image: '' } })
  }
  if (services.length > 0) {
    blocks.push({
      id: `services-${ts}`,
      sectionId: 'services',
      visible: true,
      content: {
        services: services.slice(0, 12).map((s) => ({
          title: s.title || s.name || 'Service',
          description: s.description || '',
          ...(s.price != null ? { price: Number(s.price) } : {}),
        })),
      },
    })
  }
  blocks.push({
    id: `contact-${ts}`,
    sectionId: 'contact',
    visible: true,
    content: { email: row.email || '', phone, address: row.address || '', formEnabled: true },
  })
  return blocks
}

async function main() {
  // Every provider-facing row: join provider profile for real business names
  const { data: rows, error } = await admin
    .from('mini_websites')
    .select('id, slug, user_id, provider_id, blocks, draft_blocks, hero_title, hero_tagline, tagline, title, bio, services, phone, email, address, providers(business_name, description)')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Fetch failed:', error.message)
    process.exit(1)
  }

  let seeded = 0
  let skipped = 0
  let noData = 0

  for (const row of rows || []) {
    const hasPublishedBlocks = Array.isArray(row.blocks) && row.blocks.length > 0
    const hasDraft = row.draft_blocks && (Array.isArray(row.draft_blocks) ? row.draft_blocks.length > 0 : true)

    if (hasPublishedBlocks || hasDraft) {
      skipped++
      continue
    }

    const provider = Array.isArray(row.providers) ? row.providers[0] : row.providers
    const enriched = {
      ...row,
      title: row.title || provider?.business_name || '',
      hero_title: row.hero_title || provider?.business_name || '',
      tagline: row.tagline || provider?.description || '',
      bio: row.bio || provider?.description || '',
    }

    const legacyBlocks = buildLegacyBlocks(enriched)
    const hasRealContent =
      enriched.hero_title || enriched.tagline || enriched.bio || (Array.isArray(enriched.services) && enriched.services.length > 0) || phone_or_contact(enriched)

    if (!hasRealContent) {
      noData++
      continue
    }

    const { error: updErr } = await admin
      .from('mini_websites')
      .update({
        draft_blocks: JSON.stringify(legacyBlocks),
        draft_template_id: row.template_id || null,
        draft_palette_id: row.palette_id || null,
        draft_font_pair_id: row.font_pair_id || null,
        draft_density: row.density || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (updErr) {
      console.error(`✗ ${row.slug}: ${updErr.message}`)
    } else {
      seeded++
      console.log(`✓ seeded draft for ${row.slug || row.id}`)
    }
  }

  console.log(`\nDone. Seeded: ${seeded}, skipped (already has content): ${skipped}, no data to seed: ${noData}, total: ${(rows || []).length}`)
}

function phone_or_contact(row) {
  return !!(row.phone || row.email || row.address)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
