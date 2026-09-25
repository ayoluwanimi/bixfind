import { notFound } from 'next/navigation'
import Link from 'next/link'

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

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const service = await getService(id)
  if (!service) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}/services`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; All Services</Link>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
          <div className="prose max-w-none text-gray-600 mb-6">
            <p>{service.description}</p>
          </div>
          {service.price && (
            <p className="text-2xl font-bold text-blue-600 mb-6">₦{Number(service.price).toLocaleString()}</p>
          )}
          {service.phone && (
            <a href={`tel:${service.phone}`} className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              Book Now
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
