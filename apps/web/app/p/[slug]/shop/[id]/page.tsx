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

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const website = await getWebsiteData(slug)
  if (!website) notFound()

  const sections = website.sections || []
  const productsSection = sections.find((s: any) => s.section_id === 'products')
  const products: any[] = productsSection?.content?.products || []
  const product = products[parseInt(id)]

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}/shop`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; All Products</Link>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {product.image && (
            <div className="aspect-video bg-gray-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-blue-600 mb-4">₦{Number(product.price || 0).toLocaleString()}</p>
            {product.description && <p className="text-gray-600 mb-6">{product.description}</p>}
            {product.stock > 0 ? (
              <p className="text-green-600 font-semibold mb-4">{product.stock} in stock</p>
            ) : (
              <p className="text-red-600 font-semibold mb-4">Out of stock</p>
            )}
            {website.phone && (
              <a href={`tel:${website.phone}`} className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                Contact Seller to Order
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
