'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Search, AlertTriangle, CheckCircle, Clock, Plus, X } from 'lucide-react'
import { storage } from '@/lib/storage'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  status: 'in_stock' | 'low' | 'out_of_stock'
  lastUpdated: string
  category: string
}

type StatusFilter = 'all' | 'in_stock' | 'low' | 'out_of_stock'

const statusConfig = {
  in_stock: { label: 'In Stock', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  low: { label: 'Low Stock', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
  out_of_stock: { label: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-500/20', icon: X },
}

function AddItemModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (item: Omit<InventoryItem, 'id'>) => void
}) {
  const [form, setForm] = useState({ name: '', quantity: '', category: '' })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    const qty = Number(form.quantity) || 0
    onSave({
      name: form.name,
      quantity: qty,
      status: qty === 0 ? 'out_of_stock' : qty <= 5 ? 'low' : 'in_stock',
      lastUpdated: new Date().toISOString().slice(0, 10),
      category: form.category || 'General',
    })
    setForm({ name: '', quantity: '', category: '' })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Inventory Item</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Item Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Item name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="10" min="0" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Category</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="General" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">Add Item</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function ProviderInventoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [addModal, setAddModal] = useState(false)

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

    const saved = storage.get('provider_inventory')
    if (saved && saved.length > 0) {
      setItems(saved)
    }

    setTimeout(() => setLoading(false), 300)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const addItem = useCallback((data: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...data, id: `i_${Date.now()}` }
    const updated = [...items, newItem]
    setItems(updated)
    storage.set('provider_inventory', updated)
  }, [items])

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <AddItemModal open={addModal} onClose={() => setAddModal(false)} onSave={addItem} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-white/50 mt-1">Track and manage your inventory</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Item
        </motion.button>
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Search inventory..." />
        </div>
        <div className="flex gap-2">
          {(['all', 'in_stock', 'low', 'out_of_stock'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              {s === 'all' ? 'All' : s === 'in_stock' ? 'In Stock' : s === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-1">
            {search || statusFilter !== 'all' ? 'No matching items' : 'No inventory items'}
          </h3>
          <p className="text-white/40 text-sm">Add your first inventory item to start tracking.</p>
        </motion.div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                <th className="text-left py-3 px-4 font-medium">Item</th>
                <th className="text-left py-3 px-4 font-medium">Category</th>
                <th className="text-right py-3 px-4 font-medium">Quantity</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-right py-3 px-4 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item, i) => {
                  const cfg = statusConfig[item.status]
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-white/30" />
                          <span className="text-white text-sm font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-white/50">{item.category}</td>
                      <td className={`py-4 px-4 text-right text-sm font-mono ${item.quantity === 0 ? 'text-red-400' : item.quantity <= 5 ? 'text-amber-400' : 'text-white'}`}>{item.quantity}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-white/40">
                        <span className="flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> {new Date(item.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
