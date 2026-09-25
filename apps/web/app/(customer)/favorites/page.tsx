'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Star, X, Check, ShoppingCart } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const user = storage.getUser()
    if (!user) { router.push('/login'); return }
    setFavorites(storage.get('user_favorites') || [])
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const handleRemove = (id: string) => {
    const updated = favorites.filter(f => f.id !== id)
    setFavorites(updated)
    storage.set('user_favorites', updated)
    showToast('Removed from favorites')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" suppressHydrationWarning>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold">Favorites</h1>
          <p className="text-white/60 mt-1">Your saved services and providers</p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/5 border border-white/10 rounded-xl mt-6"
          >
            <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-xl font-bold">No favorites yet</p>
            <p className="text-white/60 mt-2">Save services you love so you can find them later</p>
            <Link href="/search" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
              Browse Services
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
              >
                <div className={`h-36 bg-gradient-to-br ${fav.gradient} relative`}>
                  <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {fav.category}
                  </span>
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/60"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors">{fav.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{fav.provider}</p>
                  <div className="flex items-center mt-2 gap-1">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < Math.floor(fav.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    ))}
                    <span className="text-sm text-white/60 ml-2">{fav.rating}</span>
                    <span className="text-xs text-white/30 ml-1">({fav.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-2xl font-bold">&#x20A6;{fav.price.toLocaleString()}</p>
                    <div className="flex gap-2">
                      <Link
                        href={`/book-service/${fav.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <ShoppingCart className="w-4 h-4" /> Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
