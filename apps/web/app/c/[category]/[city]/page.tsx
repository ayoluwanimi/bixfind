import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import TierBadge from '@/components/TierBadge'

export const revalidate = 3600

interface Props {
  params: Promise<{ category: string; city: string }>
}

function titleize(s: string) {
  return decodeURIComponent(s)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function getProviders(category: string, city: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('providers')
      .select('id, business_name, description, logo_url, city, state, primary_category, tier, is_verified, mini_websites(slug)')
      .ilike('primary_category', category.replace(/-/g, ' '))
      .ilike('city', city.replace(/-/g, ' '))
      .eq('is_active', true)
      .limit(30)
    return data || []
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, city } = await params
  const cat = titleize(category)
  const town = titleize(city)
  const title = `${cat} in ${town}, Nigeria | Bixfind`
  const description = `Find trusted ${cat.toLowerCase()} in ${town}. Compare verified providers, read reviews, and book with escrow protection on Bixfind.`
  return {
    title,
    description,
    alternates: { canonical: `/c/${category}/${city}` },
    openGraph: { title, description, type: 'website' },
  }
}

export default async function CategoryCityPage({ params }: Props) {
  const { category, city } = await params
  const cat = titleize(category)
  const town = titleize(city)
  const providers = await getProviders(category, city)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cat} in ${town}`,
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 20).map((p: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: p.business_name,
        address: { '@type': 'PostalAddress', addressLocality: p.city, addressRegion: p.state, addressCountry: 'NG' },
        ...(p.mini_websites?.[0]?.slug ? { url: `/p/${p.mini_websites[0].slug}` } : {}),
      },
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-1">/</span>
            <span>{cat}</span>
            <span className="mx-1">/</span>
            <span>{town}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{cat} in {town}</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {providers.length > 0
              ? `${providers.length} verified ${cat.toLowerCase()} ready to help in ${town}. Every booking is protected by Bixfind escrow — money is only released when the job is done.`
              : `We're onboarding more ${cat.toLowerCase()} in ${town}. Browse all providers or list your own ${cat.toLowerCase()} business for free.`}
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="/search" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
              Browse all services
            </Link>
            <Link href="/provider" className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition text-sm">
              List your business — free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {providers.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center">
            <p className="text-gray-700 font-semibold mb-1">No {cat.toLowerCase()} listed in {town} yet</p>
            <p className="text-gray-500 text-sm mb-4">Be the first — a free Bixfind website takes about 10 minutes to set up.</p>
            <Link href="/provider" className="text-blue-600 font-semibold hover:underline">Get started →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((p: any) => {
              const slug = p.mini_websites?.[0]?.slug
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    {p.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo_url} alt={p.business_name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold">
                        {p.business_name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-gray-900 truncate">{p.business_name}</h2>
                        <TierBadge tier={p.tier} verified={p.is_verified} />
                      </div>
                      <p className="text-xs text-gray-500">{[p.city, p.state].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                  {p.description && <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.description}</p>}
                  <div className="mt-auto">
                    {slug ? (
                      <Link href={`/p/${slug}`} className="block text-center py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition">
                        Visit Website
                      </Link>
                    ) : (
                      <Link href="/search" className="block text-center py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition">
                        Find on Bixfind
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
