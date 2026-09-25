'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Download, Plus, Trash2, Building2, DoorOpen, Users, X } from 'lucide-react'
import { storage } from '@/lib/storage'

interface Room {
  id: string
  number: string
  type: string
  capacity: number
  price: number
  available: boolean
}

function AddRoomModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (room: Omit<Room, 'id'>) => void
}) {
  const [form, setForm] = useState({ number: '', type: 'Standard', capacity: '2', price: '' })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.number || !form.price) return
    onSave({
      number: form.number,
      type: form.type,
      capacity: Number(form.capacity),
      price: Number(form.price),
      available: true,
    })
    setForm({ number: '', type: 'Standard', capacity: '2', price: '' })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Room</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Room Number</label>
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="101" required />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Room Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 transition-colors">
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="Suite">Suite</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" min="1" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Price/Night (\u20A6)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="25000" required min="0" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">Add Room</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function ProviderHotelPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

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

    const saved = storage.get('provider_hotel_rooms')
    if (saved && saved.length > 0) {
      setRooms(saved)
    }

    const savedQr = storage.get('provider_hotel_qr')
    if (savedQr) setQrCode(savedQr)
    else generateQrCode()

    setTimeout(() => setLoading(false), 300)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const generateQrCode = useCallback(() => {
    const businessName = user?.fullName || 'My Hotel'
    const data = JSON.stringify({ business: businessName, type: 'hotel_checkin', id: Date.now() })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="white" rx="10"/>
      <rect x="20" y="20" width="60" height="60" fill="black" rx="4"/>
      <rect x="90" y="20" width="30" height="30" fill="black"/>
      <rect x="130" y="20" width="50" height="50" fill="black" rx="3"/>
      <rect x="20" y="90" width="30" height="30" fill="black"/>
      <rect x="60" y="90" width="60" height="30" fill="black"/>
      <rect x="130" y="90" width="30" height="60" fill="black"/>
      <rect x="20" y="130" width="50" height="50" fill="black" rx="3"/>
      <rect x="90" y="130" width="30" height="30" fill="black"/>
      <rect x="130" y="160" width="50" height="20" fill="black"/>
      <rect x="170" y="90" width="10" height="10" fill="black"/>
      <rect x="170" y="110" width="10" height="10" fill="black"/>
      <rect x="60" y="170" width="20" height="10" fill="black"/>
    </svg>`
    const encoded = `data:image/svg+xml;base64,${btoa(svg)}`
    setQrCode(encoded)
    storage.set('provider_hotel_qr', encoded)
  }, [user])

  const addRoom = useCallback((data: Omit<Room, 'id'>) => {
    const newRoom: Room = { ...data, id: `r_${Date.now()}` }
    const updated = [...rooms, newRoom]
    setRooms(updated)
    storage.set('provider_hotel_rooms', updated)
  }, [rooms])

  const removeRoom = useCallback((id: string) => {
    const updated = rooms.filter(r => r.id !== id)
    setRooms(updated)
    storage.set('provider_hotel_rooms', updated)
  }, [rooms])

  const toggleAvailability = useCallback((id: string) => {
    const updated = rooms.map(r => r.id === id ? { ...r, available: !r.available } : r)
    setRooms(updated)
    storage.set('provider_hotel_rooms', updated)
  }, [rooms])

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <AddRoomModal open={addModal} onClose={() => setAddModal(false)} onSave={addRoom} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hotel Management</h1>
          <p className="text-white/50 mt-1">Manage QR codes and room services</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><QrCode className="w-5 h-5 text-blue-400" /> Check-in QR Code</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="w-48 h-48 bg-white/10 rounded-xl mx-auto" />
              <div className="h-4 bg-white/10 rounded w-40 mx-auto" />
            </div>
          ) : (
            <div className="text-center">
              {qrCode && (
                <img src={qrCode} alt="Hotel QR Code" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />
              )}
              <p className="text-white/50 text-sm mt-3 mb-4">Guests scan this QR code for quick check-in</p>
              <div className="flex justify-center gap-3">
                <button onClick={generateQrCode} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">
                  <QrCode className="w-4 h-4" /> Regenerate
                </button>
                <a href={qrCode || '#'} download="hotel-qr-code.svg" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {/* Room Management */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-emerald-400" /> Rooms</h2>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium">
              <Plus className="w-3.5 h-3.5" /> Add Room
            </motion.button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-10">
              <DoorOpen className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No rooms added yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <AnimatePresence>
                {rooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <DoorOpen className={`w-5 h-5 ${room.available ? 'text-green-400' : 'text-red-400'}`} />
                      <div>
                        <p className="text-white font-medium text-sm">Room {room.number}</p>
                        <p className="text-xs text-white/40">{room.type} &middot; {room.capacity} guest{room.capacity > 1 ? 's' : ''} &middot; \u20A6{room.price.toLocaleString()}/night</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailability(room.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${room.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {room.available ? 'Available' : 'Occupied'}
                      </button>
                      <button onClick={() => removeRoom(room.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
