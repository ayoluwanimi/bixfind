import { getProviderTheme, getDensityStyles } from '@bixfind/core'
import { getTemplateById, getFontPairById, getSectionById } from '@bixfind/design-tokens/src/builder'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import MobileNav from './mobile-nav'

function formatPrice(n: unknown): string {
  const num = Number(n)
  if (!num && num !== 0) return ''
  return '₦' + num.toLocaleString('en-NG')
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Data ──────────────────────────────────────────────────────
// Read-only fetch: this renderer NEVER writes to the database, so
// visiting a provider site cannot mutate their content.
async function getWebsiteData(slug: string) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('mini_websites')
      .select('*, providers(business_name, business_phone, business_email, logo_url, address, city, state, description)')
      .eq('slug', slug)
      .eq('is_published', true)
      .limit(1)
      .single()

    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

function parseJsonArray(val: any): any[] {
  if (!val) return []
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return Array.isArray(val) ? val : []
}

/**
 * Synthesize a blocks array from the legacy flat columns + provider profile.
 * Used ONLY for rendering when the row has no saved blocks — nothing is
 * written back, so legacy data is preserved exactly as stored.
 */
function buildLegacyRenderBlocks(site: any, provider: any): any[] {
  const heroTitle = site.hero_title || site.title || provider?.business_name || ''
  const heroTagline = site.hero_tagline || site.tagline || provider?.description || ''
  const services = parseJsonArray(site.services)
  const about = site.bio || provider?.description || ''

  const blocks: any[] = [
    {
      id: 'legacy-hero',
      sectionId: 'hero',
      visible: true,
      content: {
        title: heroTitle,
        tagline: heroTagline,
        ctaText: (site.phone || provider?.business_phone) ? 'Contact Us' : 'Get Started',
        ctaLink: (site.phone || provider?.business_phone) ? `tel:${site.phone || provider?.business_phone}` : '#',
        backgroundType: 'color',
        backgroundImage: '',
      },
    },
  ]
  if (about) {
    blocks.push({ id: 'legacy-about', sectionId: 'about', visible: true, content: { content: about, image: '' } })
  }
  if (services.length > 0) {
    blocks.push({
      id: 'legacy-services',
      sectionId: 'services',
      visible: true,
      content: {
        services: services.slice(0, 12).map((s: any) => ({
          title: s.title || s.name || 'Service',
          description: s.description || '',
          ...(s.price != null ? { price: Number(s.price) } : {}),
        })),
      },
    })
  }
  blocks.push({
    id: 'legacy-contact',
    sectionId: 'contact',
    visible: true,
    content: {
      email: site.email || provider?.business_email || '',
      phone: site.phone || provider?.business_phone || '',
      address: site.address || provider?.address || '',
      formEnabled: true,
    },
  })
  return blocks
}

/**
 * Fill placeholder or empty block content from legacy columns / provider
 * profile. Render-time only: nothing is written back to the database.
 */
function overlayProviderData(blocks: any[], site: any, provider: any): any[] {
  const overlay = (content: any, fallbacks: Record<string, unknown>) => {
    const next = { ...content }
    for (const [key, fb] of Object.entries(fallbacks)) {
      if (isPlaceholder(next[key])) next[key] = fb
    }
    return next
  }

  return blocks.map((b) => {
    const sid = b.sectionId || b.section_id
    const content = b.content || {}

    if (sid === 'hero') {
      return {
        ...b,
        content: overlay(content, {
          title: site.title || site.hero_title || provider?.business_name || '',
          tagline: site.hero_tagline || site.tagline || provider?.description || '',
          ctaText: site.phone || provider?.business_phone ? 'Contact Us' : '',
          ctaLink:
            (site.phone || provider?.business_phone) && (isPlaceholder(content.ctaLink) || content.ctaLink === '#')
              ? `tel:${site.phone || provider?.business_phone}`
              : undefined,
        }),
      }
    }
    if (sid === 'contact') {
      return {
        ...b,
        content: overlay(content, {
          email: site.email || provider?.business_email || '',
          phone: site.phone || provider?.business_phone || '',
          address: site.address || provider?.address || '',
        }),
      }
    }
    if (sid === 'about') {
      return {
        ...b,
        content: overlay(content, {
          content: site.bio || provider?.description || '',
        }),
      }
    }
    return b
  })
}

/** Resolve the effective palette, honouring builder custom colors. */
function resolvePalette(site: any): { palette: string[]; isCustom: boolean } {
  const custom = typeof site.custom_colors === 'string' ? safeParse(site.custom_colors) : site.custom_colors
  if (site.palette_id === 'custom' && custom && typeof custom.primary === 'string') {
    return {
      palette: [custom.primary, custom.background || '#FFFFFF', custom.accent || custom.primary],
      isCustom: true,
    }
  }
  const theme = getProviderTheme(site)
  return { palette: theme.palette, isCustom: false }
}

function safeParse(val: any): any {
  if (typeof val !== 'string') return val
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}

/**
 * Builder defaults that were accidentally published by an old bug.
 * Treated as empty so real provider data (legacy columns / profile) wins.
 */
const PLACEHOLDER_PATTERNS = [
  /^welcome$/i,
  /^your (business )?name$/i,
  /^your tagline( here)?$/i,
  /^tagline here$/i,
  /^get started$/i,
  /^about your business\.?\.?\.?$/i,
  /^experience the best with /i,
]

function isPlaceholder(val: unknown): boolean {
  if (typeof val !== 'string') return false
  const s = val.trim()
  if (!s) return true
  return PLACEHOLDER_PATTERNS.some((p) => p.test(s))
}

// ─── SEO ───────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const site = await getWebsiteData(slug)
  if (!site) return { title: 'Not Found | Bixfind' }

  const provider = Array.isArray(site.providers) ? site.providers[0] : site.providers
  const blocks = parseJsonArray(site.blocks)
  const seoBlock = blocks.find((b: any) => (b.sectionId || b.section_id) === 'seo')
  const seo = seoBlock?.content || {}
  const heroBlock = blocks.find((b: any) => (b.sectionId || b.section_id) === 'hero')
  const hero = heroBlock?.content || {}

  const businessName =
    site.title || hero.title || site.hero_title || provider?.business_name || slug
  const description =
    seo.description ||
    hero.tagline ||
    site.hero_tagline ||
    site.tagline ||
    site.bio ||
    provider?.description ||
    `${businessName} on Bixfind — find and book trusted local services in Nigeria.`

  const ogImage = seo.ogImage || site.banner_url || (hero.backgroundType === 'image' ? hero.backgroundImage : '') || undefined

  return {
    title: seo.title || `${businessName} | Bixfind`,
    description: String(description).slice(0, 300),
    keywords: seo.keywords ? String(seo.keywords).split(',').map((k: string) => k.trim()).filter(Boolean) : undefined,
    openGraph: {
      title: seo.title || `${businessName} | Bixfind`,
      description: String(description).slice(0, 300),
      type: 'website',
      images: ogImage ? [{ url: String(ogImage) }] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

// ─── Page ──────────────────────────────────────────────────────
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params
  const site = await getWebsiteData(slug)

  if (!site) {
    notFound()
  }

  const provider = Array.isArray(site.providers) ? site.providers[0] : site.providers

  // Theme inputs (snake_case, matching getProviderTheme's expectations)
  const themeInput = {
    template_id: site.template_id || 'minimal',
    font_pair_id: site.font_pair_id || 'modern-sans',
    density: site.density || 'comfortable',
    palette_id: site.palette_id || 'ocean',
    custom_colors: typeof site.custom_colors === 'string' ? safeParse(site.custom_colors) : site.custom_colors,
  }
  const fontPair = getFontPairById(themeInput.font_pair_id)
  const { palette } = resolvePalette(site)

  const theme = {
    ...getProviderTheme(themeInput),
    palette,
    fontFamily: fontPair?.body.family || 'Inter, sans-serif',
    headingFontFamily: fontPair?.heading.family || 'Clash Display, Inter, sans-serif',
  }

  const density = getDensityStyles(themeInput.density)
  const template = getTemplateById(themeInput.template_id)

  const heroBlock = parseJsonArray(site.blocks).find((b: any) => (b.sectionId || b.section_id) === 'hero')
  const businessName =
    site.title || heroBlock?.content?.title || site.hero_title || provider?.business_name || slug

  // Published blocks, or a read-only legacy rendering when none exist
  let blocks = parseJsonArray(site.blocks).map((b: any, i: number) => ({
    ...b,
    id: b.id || `${b.sectionId || b.section_id || 'block'}-${i}`,
    visible: b.visible !== false,
  }))
  if (blocks.length === 0) {
    blocks = buildLegacyRenderBlocks(site, provider)
  } else {
    // Overlay: fill placeholder/empty content with real provider data
    // (render-time only — the stored blocks are never modified)
    blocks = overlayProviderData(blocks, site, provider)
  }

  const visibleBlocks = blocks.filter((b: any) => b.visible)
  const websiteForNav = {
    logo_url: site.logo_url || provider?.logo_url || '',
    business_name: businessName,
    display_name: businessName,
    slug: site.slug,
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: theme.fontFamily }}>
      <MobileNav
        slug={slug}
        navLinks={visibleBlocks
          .map((b: any) => {
            const sectionId = b.sectionId || b.section_id
            const section = getSectionById(sectionId)
            return section && sectionId !== 'seo' ? { id: sectionId, label: section.label } : null
          })
          .filter(Boolean) as Array<{ id: string; label: string }>}
        website={websiteForNav}
        theme={theme}
        template={template}
        density={density}
      />

      <main className={density.sectionGap}>
        {visibleBlocks.map((block: any) => (
          <section key={block.id} id={block.sectionId || block.section_id} className={density.padding}>
            <RenderBlock
              block={block}
              theme={theme}
              density={density}
              site={site}
              provider={provider}
              businessName={businessName}
              slug={slug}
            />
          </section>
        ))}
      </main>

      <footer className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {(site.footer_business_name || site.footer_tagline) && (
            <div className="mb-4">
              {site.footer_business_name && <p className="text-white font-semibold text-lg">{site.footer_business_name}</p>}
              {site.footer_tagline && <p className="text-white/50 text-sm mt-1">{site.footer_tagline}</p>}
            </div>
          )}
          {(site.phone || provider?.business_phone || site.email || provider?.business_email) && (
            <div className="flex items-center justify-center gap-4 mb-3 text-sm text-white/60 flex-wrap">
              {(site.phone || provider?.business_phone) && (
                <a href={`tel:${site.phone || provider?.business_phone}`} className="hover:text-white transition-colors">
                  📞 {site.phone || provider?.business_phone}
                </a>
              )}
              {(site.email || provider?.business_email) && (
                <a href={`mailto:${site.email || provider?.business_email}`} className="hover:text-white transition-colors">
                  ✉️ {site.email || provider?.business_email}
                </a>
              )}
            </div>
          )}
          {(() => {
            const socialLinks: { url: string; label: string; icon: JSX.Element; color: string }[] = []
            if (site.social_facebook) socialLinks.push({ url: site.social_facebook, label: 'Facebook', color: 'hover:text-blue-400', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> })
            if (site.social_instagram) socialLinks.push({ url: site.social_instagram, label: 'Instagram', color: 'hover:text-pink-400', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> })
            if (site.social_twitter) socialLinks.push({ url: site.social_twitter, label: 'X / Twitter', color: 'hover:text-sky-400', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> })
            if (site.social_tiktok) socialLinks.push({ url: site.social_tiktok, label: 'TikTok', color: 'hover:text-white', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> })
            if (site.social_linkedin) socialLinks.push({ url: site.social_linkedin, label: 'LinkedIn', color: 'hover:text-blue-500', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> })
            if (site.social_youtube) socialLinks.push({ url: site.social_youtube, label: 'YouTube', color: 'hover:text-red-400', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> })
            if (socialLinks.length === 0) return null
            return (
              <div className="flex items-center justify-center gap-4 mb-4 text-white/50 flex-wrap">
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className={`transition-colors ${link.color}`} aria-label={link.label}>
                    {link.icon}
                  </a>
                ))}
              </div>
            )
          })()}
          {site.footer_show_powered_by !== false && (
            <p className="text-white/30 text-xs">
              Powered by{' '}
              <a href="https://bixfind.indevs.in" className="underline hover:text-white/60">
                Bixfind
              </a>
            </p>
          )}
        </div>
      </footer>

      {(site.whatsapp_enabled && site.whatsapp_number) && (
        <a
          href={`https://wa.me/${String(site.whatsapp_number).replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  )
}

// ─── Blocks ────────────────────────────────────────────────────
function RenderBlock({
  block,
  theme,
  density,
  site,
  provider,
  businessName,
  slug,
}: {
  block: any
  theme: any
  density: any
  site: any
  provider: any
  businessName: string
  slug: string
}) {
  const content = block.content || {}
  const bgImage = content.backgroundType === 'image' && content.backgroundImage ? String(content.backgroundImage) : null
  const heroBg = bgImage
    ? `url(${bgImage}) center/cover no-repeat`
    : `linear-gradient(135deg, ${theme.palette[0]}, ${theme.palette[2] || theme.palette[0]})`

  switch (block.sectionId || block.section_id) {
    case 'hero': {
      const title = content.title || site.hero_title || site.title || businessName
      const tagline = content.tagline || site.hero_tagline || site.tagline || provider?.description || ''
      const ctaText = content.ctaText || 'Contact Us'
      const ctaLink = content.ctaLink || (site.phone || provider?.business_phone ? `tel:${site.phone || provider?.business_phone}` : '#')
      // Density-aware hero title size — plain classes, no conflicts
      const titleSize =
        density.heroHeight.includes('40vh') // compact
          ? 'text-3xl sm:text-4xl md:text-5xl'
          : density.heroHeight.includes('80vh') // spacious
            ? 'text-4xl sm:text-5xl md:text-6xl'
            : 'text-3xl sm:text-4xl md:text-5xl'
      return (
        <div className={`text-center ${density.heroHeight} flex items-center justify-center px-4 relative overflow-hidden`} style={{ background: heroBg }}>
          {bgImage && <div className="absolute inset-0 bg-black/40" />}
          <div className="max-w-2xl relative z-10">
            {(site.logo_url || provider?.logo_url) && (
              <img src={site.logo_url || provider?.logo_url} alt={businessName} className="h-16 sm:h-20 w-auto mx-auto mb-6 object-contain" />
            )}
            <h1 className={`${titleSize} font-bold text-white mb-4`} style={{ fontFamily: theme.headingFontFamily }}>
              {title || businessName}
            </h1>
            {tagline && <p className="text-lg sm:text-xl text-white/80 mb-6">{tagline}</p>}
            {(content.ctaText || site.phone || provider?.business_phone) && (
              <a href={ctaLink} className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
                {ctaText}
              </a>
            )}
          </div>
        </div>
      )
    }
    case 'about': {
      const about = content.content || site.bio || provider?.description || ''
      if (!about) return null
      return (
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            About
          </h2>
          <div className="text-gray-600 leading-relaxed text-base md:text-lg">
            {String(about)
              .split('\n')
              .map((p: string, i: number) => (
                <p key={i} className="mb-4">
                  {p}
                </p>
              ))}
          </div>
        </div>
      )
    }
    case 'services': {
      const fallback = parseJsonArray(site.services)
      const services =
        (Array.isArray(content.services) && content.services.length > 0
          ? content.services
          : fallback) || []
      if (services.length === 0) return null
      return (
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Services
          </h2>
          <div className={`grid sm:grid-cols-2 md:grid-cols-3 ${density.cardGap}`}>
            {services.map((service: any, i: number) => (
              <div key={i} className={`${density.cardPadding} bg-white rounded-xl shadow-lg border border-gray-100`}>
                <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: theme.headingFontFamily }}>
                  {service.title || service.name || 'Service'}
                </h3>
                {service.description && <p className="text-gray-600 text-sm">{service.description}</p>}
                {service.price != null && Number(service.price) > 0 && (
                  <p className="font-bold mt-2 text-sm" style={{ color: theme.palette[0] }}>
                    {formatPrice(service.price)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'gallery': {
      const images = (Array.isArray(content.images) ? content.images : []).filter(Boolean)
      if (images.length === 0) return null
      return (
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Gallery
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img: string, i: number) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'contact': {
      const email = content.email || site.email || provider?.business_email || ''
      const phone = content.phone || site.phone || provider?.business_phone || ''
      const address = content.address || site.address || provider?.address || ''
      if (!email && !phone && !address) return null
      return (
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Contact
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              {email && (
                <p className="flex items-center gap-2 text-gray-600 text-sm sm:text-base break-all">
                  <span className="font-semibold text-gray-900">Email:</span>{' '}
                  <a href={`mailto:${email}`} className="hover:underline">
                    {email}
                  </a>
                </p>
              )}
              {phone && (
                <p className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                  <span className="font-semibold text-gray-900">Phone:</span>{' '}
                  <a href={`tel:${phone}`} className="hover:underline">
                    {phone}
                  </a>
                </p>
              )}
              {address && (
                <p className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                  <span className="font-semibold text-gray-900">Address:</span> {address}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }
    case 'products': {
      const products = content.products as Array<{ name: string; price: number; image?: string }>
      if (!products?.length) return null
      return (
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Products
          </h2>
          <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${density.cardGap}`}>
            {products.map((product, i) => (
              <Link key={i} href={`/p/${slug}/shop/${i}`} className={`${density.cardPadding} bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition`}>
                {product.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" loading="lazy" />
                )}
                <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
                <p className="font-bold text-sm sm:text-base" style={{ color: theme.palette[0] }}>
                  {formatPrice(product.price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )
    }
    case 'music': {
      const tracks = content.tracks as Array<{ title: string; audioUrl?: string }>
      if (!tracks?.length) return null
      return (
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Music
          </h2>
          <div className={`grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 ${density.cardGap}`}>
            {tracks.map((track, i) => (
              <div key={i} className={`${density.cardPadding} bg-white rounded-xl shadow-lg border border-gray-100`}>
                <h3 className="font-semibold mb-2">{track.title}</h3>
                {track.audioUrl && <audio src={track.audioUrl} controls className="w-full" />}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'hotel': {
      const rooms = content.rooms as Array<{ name: string; price?: number; image?: string }>
      if (!rooms?.length) return null
      return (
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Rooms & Suites
          </h2>
          <div className={`grid sm:grid-cols-2 md:grid-cols-3 ${density.cardGap}`}>
            {rooms.map((room, i) => (
              <div key={i} className={`${density.cardPadding} bg-white rounded-xl shadow-lg border border-gray-100`}>
                {room.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={room.image} alt={room.name} className="w-full aspect-[4/3] object-cover rounded-lg mb-3" loading="lazy" />
                )}
                <h3 className="font-semibold text-lg">{room.name}</h3>
                {room.price && (
                  <p className="font-bold mt-1" style={{ color: theme.palette[0] }}>
                    {formatPrice(room.price)}/night
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-sm text-gray-500">
            Check-in: {content.checkinTime || '14:00'} | Check-out: {content.checkoutTime || '12:00'}
          </div>
        </div>
      )
    }
    case 'testimonials': {
      const testimonials = content.testimonials as Array<{ name: string; text?: string; rating?: number }>
      if (!testimonials?.length) return null
      return (
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Testimonials
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                {t.rating && (
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <span key={si} className={`text-sm ${si < t.rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm italic text-gray-600">&quot;{t.text || 'Great service!'}&quot;</p>
                <p className="text-xs font-semibold text-gray-900 mt-2">- {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'pricing': {
      const plans = content.plans as Array<{ name: string; price?: number; features?: string[] }>
      if (!plans?.length) return null
      return (
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            Pricing
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl text-center border ${i === 1 ? 'border-transparent text-white' : 'bg-white shadow-lg border-gray-100'}`}
                style={i === 1 ? { background: theme.palette[0] } : {}}
              >
                <p className={`font-semibold text-lg ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                {plan.price != null && (
                  <p className={`text-3xl font-bold mt-2 ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{formatPrice(plan.price)}</p>
                )}
                {plan.features?.length ? (
                  <ul className="mt-4 space-y-2 text-sm">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`${i === 1 ? 'text-white/80' : 'text-gray-500'}`}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'faq': {
      const questions = content.questions as Array<{ question: string; answer?: string }>
      if (!questions?.length) return null
      return (
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: theme.headingFontFamily }}>
            FAQ
          </h2>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="p-5 bg-white rounded-xl shadow-lg border border-gray-100">
                <p className="font-semibold text-gray-900">{q.question}</p>
                {q.answer && <p className="text-sm text-gray-500 mt-2">{q.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
