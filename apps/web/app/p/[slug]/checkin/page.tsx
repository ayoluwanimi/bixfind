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

export default async function CheckinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const website = await getWebsiteData(slug)
  if (!website) notFound()

  const sections = website.sections || []
  const hotelSection = sections.find((s: any) => s.section_id === 'hotel')

  if (!hotelSection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Hotel/check-in is not available for this provider.</p>
      </div>
    )
  }

  const content = hotelSection.content || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Online Check-in</h1>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6 text-sm text-gray-500">
            <p>Check-in: {content.checkinTime || '14:00'}</p>
            <p>Check-out: {content.checkoutTime || '12:00'}</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Arrival Time</label>
              <input type="time" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <input type="number" min={1} defaultValue={1} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              Submit Check-in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
