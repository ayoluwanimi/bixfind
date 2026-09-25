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

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const website = await getWebsiteData(slug)
  if (!website) notFound()

  const sections = website.sections || []
  const productsSection = sections.find((s: any) => s.section_id === 'products')
  const products = productsSection?.content?.products || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shop</h1>
        {products.length === 0 ? (
          <p className="text-gray-500">No products available yet.</p>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any, i: number) => (
              <Link key={i} href={`/p/${slug}/shop/${i}`} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                {product.image && (
                  <div className="aspect-square bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900">{product.name}</h2>
                  <p className="font-bold text-blue-600 mt-1">₦{Number(product.price || 0).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
