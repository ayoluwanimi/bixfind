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

export default async function MusicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const website = await getWebsiteData(slug)
  if (!website) notFound()

  const sections = website.sections || []
  const musicSection = sections.find((s: any) => s.section_id === 'music')

  if (!musicSection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Music section is not available for this provider.</p>
      </div>
    )
  }

  const tracks: any[] = musicSection.content?.tracks || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}`} className="text-sm text-purple-200 hover:text-white mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-3xl font-bold text-white mb-8">Music</h1>
        {tracks.length === 0 ? (
          <p className="text-purple-200">No tracks available yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track: any, i: number) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                <h3 className="font-semibold text-lg mb-2">{track.title}</h3>
                {track.audioUrl && <audio src={track.audioUrl} controls className="w-full" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
