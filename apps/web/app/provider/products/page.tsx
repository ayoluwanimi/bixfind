'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Package, DollarSign, X, Share2, Copy, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'
import MediaUpload from '@/components/MediaUpload'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
}

function ProductModal({ open, onClose, product, onSave }: {
  open: boolean
  onClose: () => void
  product: Product | null
  onSave: (p: Omit<Product, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '' })

  useEffect(() => {
    if (product) {
      setForm({ name: product.name, description: product.description, price: product.price.toString(), stock: product.stock.toString(), image: product.image })
    } else {
      setForm({ name: '', description: '', price: '', stock: '', image: '' })
    }
  }, [product, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) return
    onSave({
      id: product?.id,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      image: form.image,
    })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Product Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Product name" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-20" placeholder="Product description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Price (\u20A6)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="5000" required min="0" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Stock Quantity</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="10" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Product Image or Video</label>
            <MediaUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="products" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">{product ? 'Save Changes' : 'Add Product'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function DeleteDialog({ open, name, onConfirm, onCancel }: {
  open: boolean; name: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">Delete Product</h3>
        <p className="text-white/60 mt-2 text-sm">Delete &quot;{name}&quot;? This cannot be undone.</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProviderProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [slug, setSlug] = useState('')

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') { router.push('/login'); return }
    setUser(currentUser)

    fetch('/api/provider/products', { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products) setProducts(data.products)
      })
      .catch(() => {
        const saved = storage.get('provider_products')
        if (saved && saved.length > 0) setProducts(saved)
      })
      .finally(() => setLoading(false))

    fetch(`/api/mini-websites?user_id=${encodeURIComponent(currentUser.id)}`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.slug) setSlug(data.slug)
      })
      .catch(() => {})

    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const saveProduct = useCallback(async (data: Omit<Product, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const res = await fetch('/api/provider/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const updated = products.map(p => p.id === data.id ? { ...p, ...data } as Product : p)
          setProducts(updated)
        }
      } else {
        const res = await fetch('/api/provider/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const { data: created } = await res.json()
          const newProduct: Product = {
            id: created.id,
            name: created.name,
            description: created.description || '',
            price: Number(created.price) || 0,
            stock: created.stock || 0,
            image: created.image_url || '',
          }
          setProducts([...products, newProduct])
        }
      }
    } catch {}
  }, [products])

  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    setDeleting(null)
    try {
      await fetch(`/api/provider/products?id=${id}`, { method: 'DELETE' })
    } catch {}
  }, [products])

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <ProductModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} product={editing} onSave={saveProduct} />
      <DeleteDialog open={!!deleting} name={deleting?.name || ''} onConfirm={() => deleting && deleteProduct(deleting.id)} onCancel={() => setDeleting(null)} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/50 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/p/${slug}/products`
                navigator.clipboard.writeText(url)
                toast.success('Product link copied!')
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setEditing(null); setModalOpen(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Product
          </motion.button>
        </div>
      </motion.div>

      {user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              <span className="text-blue-400 font-medium">Share your product catalog: </span>
              <code className="text-white/80 text-xs bg-white/5 px-3 py-1 rounded-lg">{`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}/products`}</code>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/p/${slug}/products`
                navigator.clipboard.writeText(url)
                toast.success('Link copied!')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-medium"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse">
              <div className="h-40 bg-white/10" />
              <div className="p-4 space-y-2"><div className="h-4 bg-white/10 rounded w-3/4" /><div className="h-3 bg-white/10 rounded w-1/2" /><div className="h-5 bg-white/10 rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-1">No products yet</h3>
          <p className="text-white/40 text-sm mb-6">Add your first product to start selling!</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Your First Product
          </button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group"
              >
                <div className="h-40 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center relative">
                  {product.image ? (
                    product.image.includes('/videos/') || product.image.match(/\.(mp4|webm|mov|avi)$/i) ? (
                      <video src={product.image} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <ImageIcon className="w-12 h-12 text-white/20" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(product); setModalOpen(true) }} className="p-1.5 rounded-lg bg-black/60 text-blue-400 hover:bg-black/80 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(product)} className="p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-black/80 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">{product.name}</h3>
                  {product.description && <p className="text-xs text-white/40 mt-0.5 truncate">{product.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-emerald-400 font-bold text-lg">\u20A6{product.price.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 10 ? 'bg-green-500/20 text-green-400' : product.stock > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
