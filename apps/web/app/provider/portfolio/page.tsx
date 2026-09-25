'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, Image as ImageIcon, Edit3 } from 'lucide-react'
import { storage } from '@/lib/storage'
import MediaUpload from '@/components/MediaUpload'

interface PortfolioItem {
  id: string
  title: string
  description: string
  imageUrl: string
  createdAt: string
}

export default function ProviderPortfolioPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [deleting, setDeleting] = useState<PortfolioItem | null>(null)

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
    const saved = storage.get('provider_portfolio')
    if (Array.isArray(saved)) setItems(saved)
    setTimeout(() => setLoading(false), 400)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const saveItems = useCallback((updated: PortfolioItem[]) => {
    setItems(updated)
    storage.set('provider_portfolio', updated)
  }, [])

  const handleSave = () => {
    if (!formTitle.trim()) return
    if (editingItem) {
      const updated = items.map(it => it.id === editingItem.id ? { ...it, title: formTitle.trim(), description: formDescription.trim(), imageUrl: formImageUrl.trim() || editingItem.imageUrl } : it)
      saveItems(updated)
    } else {
      const newItem: PortfolioItem = {
        id: `port_${Date.now()}`,
        title: formTitle.trim(),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim() || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
        createdAt: new Date().toISOString(),
      }
      saveItems([newItem, ...items])
    }
    setShowModal(false)
    setEditingItem(null)
    setFormTitle('')
    setFormDescription('')
    setFormImageUrl('')
  }

  const handleDelete = (id: string) => {
    saveItems(items.filter(it => it.id !== id))
    setDeleting(null)
  }

  const openEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormDescription(item.description)
    setFormImageUrl(item.imageUrl)
    setShowModal(true)
  }

  const openNew = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormDescription('')
    setFormImageUrl('')
    setShowModal(true)
  }

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-white/50 mt-1">Showcase your best work to potential customers</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Item
        </motion.button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse">
              <div className="h-48 bg-white/10" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/10 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-1">No portfolio items yet</h3>
          <p className="text-white/40 text-sm mb-6">Add your best work to attract more customers</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Your First Item
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                layout
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-colors"
              >
                <div className="relative h-48 overflow-hidden bg-white/5">
                  {item.imageUrl ? (
                    item.imageUrl.includes('/videos/') || item.imageUrl.match(/\.(mp4|webm|mov|avi)$/i) ? (
                      <video src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted preload="metadata" />
                    ) : (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEdit(item)} className="p-2.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleting(item)} className="p-2.5 bg-red-500/30 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                  {item.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.description}</p>}
                  <p className="text-[10px] text-white/30 mt-2">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{editingItem ? 'Edit Item' : 'Add Portfolio Item'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Title</label>
                  <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="e.g. Bridal Makeup Look" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Description</label>
                  <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-20" placeholder="Describe this work..." />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Image or Video</label>
                  <MediaUpload value={formImageUrl} onChange={setFormImageUrl} folder="portfolio" label="Upload portfolio media" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
                  <button onClick={handleSave} disabled={!formTitle.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50">{editingItem ? 'Save Changes' : 'Add Item'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleting(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white">Delete Portfolio Item</h3>
              <p className="text-white/60 mt-2 text-sm">Are you sure you want to delete &quot;{deleting.title}&quot;?</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
                <button onClick={() => handleDelete(deleting.id)} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
