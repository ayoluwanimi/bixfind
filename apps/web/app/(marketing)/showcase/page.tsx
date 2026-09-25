import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductShowcase, GlassPanel } from '@/components/showcase/ShowcaseClient'

export const metadata: Metadata = {
  title: 'Your Business, Beautifully Online | Bixfind',
  description:
    'See what a Bixfind website looks like. Every provider gets a fast, beautiful site with services, gallery, WhatsApp contact — free, in about 10 minutes.',
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: copy + CTA (kept OUTSIDE the 3D scene) */}
          <div>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              Bixfind Showcase
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Your business, beautifully online.
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Drag the preview to explore what every Bixfind provider gets: a fast
              website with services, gallery, WhatsApp chat and escrow-protected
              bookings — free, in about 10 minutes.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/provider/website"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                Build my free website →
              </Link>
              <Link
                href="/search"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Browse providers
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                'Free forever — no hosting fees',
                'Your own shareable link: bixfind.indevs.in/your-business',
                'WhatsApp one-tap contact for customers',
                'Escrow-protected bookings built in',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: interactive 3D preview (rotate-only, scroll-safe) */}
          <ProductShowcase height={380} />
        </div>

        {/* Glass feature panel (liquid-glass-js with solid fallback) */}
        <section className="mt-16">
          <GlassPanel className="rounded-2xl p-8 md:p-10" borderRadius={20}>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Look professional instantly',
                  body: 'Pick a template, palette and fonts — your site matches your brand in minutes, not weeks.',
                },
                {
                  title: 'Get found on Google',
                  body: 'Every Bixfind site ships with SEO tags, structured data and a fast mobile experience.',
                },
                {
                  title: 'Turn visits into bookings',
                  body: 'One-tap WhatsApp, click-to-call and escrow-protected booking come built in.',
                },
              ].map((f) => (
                <div key={f.title}>
                  <h2 className="font-bold text-gray-900 mb-2">{f.title}</h2>
                  <p className="text-sm text-gray-600">{f.body}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>
      </main>
    </div>
  )
}
