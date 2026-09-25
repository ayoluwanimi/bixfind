import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getWebsiteData(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/mini-websites?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data
    }
  } catch {}
  return null
}

async function getServices(providerId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/services?provider_id=${encodeURIComponent(providerId)}&published=true`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      return data.data || data
    }
  } catch {}
  return []
}

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const website = await getWebsiteData(slug)
  if (!website) notFound()

  const services = await getServices(website.provider_id || website.user_id || website.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Services</h1>
        {services.length === 0 ? (
          <p className="text-gray-500">No published services yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <Link key={service.id} href={`/p/${slug}/services/${service.id}`} className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
                <h2 className="font-semibold text-lg mb-2">{service.name}</h2>
                <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                {service.price && (
                  <p className="font-bold mt-3 text-blue-600">₦{Number(service.price).toLocaleString()}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
