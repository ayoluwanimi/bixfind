import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import BookServiceButton from '@/components/BookServiceButton'
import { getBaseUrl } from '@/lib/seo'

async function getService(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/services/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data
    }
  } catch {}
  return null
}

async function getSiteName(slug: string): Promise<string> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/mini-websites?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      const site = data.data || data
      return site?.title || site?.legacy?.hero_title || slug
    }
  } catch {}
  return slug
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params
  const [service, siteName] = await Promise.all([getService(id), getSiteName(slug)])
  if (!service) {
    return { title: 'Service not found | Bixfind', robots: { index: false, follow: false } }
  }

  const name = service.name || 'Service'
  const price = Number(service.price) || 0
  const title = `${name} — ${siteName} | Bixfind`
  const description =
    (service.description ? String(service.description).slice(0, 240) : `Book ${name} from ${siteName} on Bixfind.`) +
    (price > 0 ? ` From ₦${price.toLocaleString()}.` : '')
  const url = `${getBaseUrl()}/p/${slug}/services/${service.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Bixfind', type: 'website' },
    twitter: { card: 'summary', title, description },
    robots: { index: true, follow: true },
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const [service, siteName] = await Promise.all([getService(id), getSiteName(slug)])
  if (!service) notFound()

  const currencies: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' }
  const symbol = currencies[service.currency] || ''
  const price = Number(service.price) || 0
  const name = service.name || 'Service'

  const canonicalUrl = `${getBaseUrl()}/p/${slug}/services/${service.id}`
  const providerSiteUrl = `${getBaseUrl()}/p/${slug}`

  // Structured data: Service + Offer, tied to the provider's platform page so
  // Google connects independent business-name searches to this listing.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    ...(service.description ? { description: String(service.description).slice(0, 1000) } : {}),
    url: canonicalUrl,
    serviceType: name,
    ...(price > 0
      ? {
          offers: {
            '@type': 'Offer',
            price: price.toFixed(2),
            priceCurrency: service.currency || 'NGN',
            availability: 'https://schema.org/InStock',
            url: canonicalUrl,
          },
        }
      : {}),
    provider: {
      '@type': 'LocalBusiness',
      name: service.provider_name || siteName,
      url: providerSiteUrl,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bixfind',
      url: getBaseUrl(),
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}/services`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; All Services</Link>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{name}</h1>
          <div className="prose max-w-none text-gray-600 mb-6">
            <p>{service.description}</p>
          </div>
          {service.price && price > 0 && (
            <p className="text-2xl font-bold text-blue-600 mb-6">{symbol}{price.toLocaleString()}</p>
          )}
          <BookServiceButton
            serviceId={service.id}
            serviceTitle={name || 'Service'}
            providerName={service.provider_name || siteName}
            price={price}
            currency={service.currency || 'NGN'}
          />
          {service.phone && (
            <a href={`tel:${service.phone}`} className="ml-3 text-sm text-gray-500 hover:text-gray-700">
              or call {service.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
