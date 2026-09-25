import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, MessageCircle, ArrowLeft, ImageIcon } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
}

async function getProducts(slug: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'
    const res = await fetch(`${base}/api/products?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.data && data.data.length > 0) return data.data
    }
  } catch {}

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/products?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      const items = data.data || data || []
      return items.map((p: Record<string, unknown>) => ({
        ...p,
        image: p.image || p.image_url || '',
      }))
    }
  } catch {}

  return null
}

async function getBusinessInfo(slug: string) {
  try {
    const supabase = (await import('@/lib/supabase/server')).createClient
    const client = await supabase()

    const { data: profile } = await client
      .from('mini_websites')
      .select('business_name, display_name, phone')
      .eq('company_name', slug)
      .maybeSingle()

    if (profile) return profile

    const { data: userProfile } = await client
      .from('users')
      .select('display_name, phone')
      .eq('id', slug)
      .maybeSingle()

    if (userProfile) return { business_name: userProfile.display_name || 'Shop', display_name: userProfile.display_name, phone: userProfile.phone || '' }
  } catch {}

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'}/api/mini-websites?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      const w = data.data || data
      return { business_name: w.business_name, display_name: w.display_name, phone: w.phone }
    }
  } catch {}

  return { business_name: slug, display_name: slug, phone: '' }
}

export default async function PublicProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [products, info] = await Promise.all([
    getProducts(slug),
    getBusinessInfo(slug),
  ])

  if (products === null && !info.business_name) notFound()

  const businessName = info.business_name || info.display_name || slug
  const phone = info.phone || ''
  const items = products || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href={`/p/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to {businessName}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Browse the product catalog from {businessName}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">No products available</h3>
            <p className="text-gray-400 text-sm">Check back later for updates.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product: Product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  {product.stock <= 0 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                      Out of Stock
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{product.description}</p>
                  )}
                  <p className="font-bold text-lg text-gray-900 mb-3">&#8358;{product.price.toLocaleString()}</p>
                  {phone ? (
                    <a
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in "${product.name}" (₦${product.price.toLocaleString()}). Is it available?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" /> Contact to Order
                    </a>
                  ) : (
                    <button disabled className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm font-medium cursor-not-allowed">
                      <MessageCircle className="w-4 h-4" /> Contact to Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-gray-900 text-white text-center py-8 text-sm">
        <p>Powered by <a href="https://bixfind.indevs.in" className="underline">Bixfind</a></p>
      </footer>
    </div>
  )
}
