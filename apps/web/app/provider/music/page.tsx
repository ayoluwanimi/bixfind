'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Upload, Play, Pause, Trash2, Clock, User, Disc3, Plus, X } from 'lucide-react'
import { storage } from '@/lib/storage'

interface Track {
  id: string
  title: string
  artist: string
  duration: string
  genre: string
  createdAt: string
}

function UploadModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (track: Omit<Track, 'id'>) => void
}) {
  const [form, setForm] = useState({ title: '', artist: '', duration: '', genre: 'Afrobeat' })
  const [uploading, setUploading] = useState(false)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.artist || !form.duration) return
    setUploading(true)
    setTimeout(() => {
      onSave({
        title: form.title,
        artist: form.artist,
        duration: form.duration,
        genre: form.genre,
        createdAt: new Date().toISOString(),
      })
      setForm({ title: '', artist: '', duration: '', genre: 'Afrobeat' })
      setUploading(false)
      onClose()
    }, 1200)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Upload Track</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Track Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Summer Vibes" required />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Artist Name</label>
            <input value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Artist Name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Duration</label>
              <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="3:45" required />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Genre</label>
              <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 transition-colors">
                <option value="Afrobeat">Afrobeat</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="R&B">R&amp;B</option>
                <option value="Gospel">Gospel</option>
                <option value="Jazz">Jazz</option>
                <option value="Pop">Pop</option>
                <option value="Traditional">Traditional</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-xs text-white/40">Audio file upload (simulated)</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={uploading} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-50 transition-colors text-sm">Cancel</button>
            <button type="submit" disabled={uploading} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium">
              {uploading ? 'Uploading...' : 'Upload Track'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function ProviderMusicPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

    const saved = storage.get('provider_music_tracks')
    if (saved && saved.length > 0) {
      setTracks(saved)
    }

    setTimeout(() => setLoading(false), 300)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const addTrack = useCallback((data: Omit<Track, 'id'>) => {
    const newTrack: Track = { ...data, id: `m_${Date.now()}` }
    const updated = [newTrack, ...tracks]
    setTracks(updated)
    storage.set('provider_music_tracks', updated)
  }, [tracks])

  const deleteTrack = useCallback((id: string) => {
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null) }
    const updated = tracks.filter(t => t.id !== id)
    setTracks(updated)
    storage.set('provider_music_tracks', updated)
  }, [tracks, playingId])

  const togglePlay = useCallback((id: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      audioRef.current?.pause()
      setPlayingId(id)
      if (audioRef.current) {
        audioRef.current.src = ''
        audioRef.current.play().catch(() => {})
      }
    }
  }, [playingId])

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <UploadModal open={addModal} onClose={() => setAddModal(false)} onSave={addTrack} />
      <audio ref={audioRef} className="hidden" />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Music Management</h1>
          <p className="text-white/50 mt-1">Manage your music portfolio and tracks</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Upload Track
        </motion.button>
      </motion.div>

      {/* Currently Playing Bar */}
      {playingId && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
          <Disc3 className="w-6 h-6 text-blue-400 animate-spin" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{tracks.find(t => t.id === playingId)?.title}</p>
            <p className="text-white/50 text-xs">{tracks.find(t => t.id === playingId)?.artist}</p>
          </div>
          <button onClick={() => setPlayingId(null)} className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors">
            <Pause className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Track List */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2"><div className="h-4 bg-white/10 rounded w-40" /><div className="h-3 bg-white/10 rounded w-24" /></div>
              <div className="h-3 bg-white/10 rounded w-12" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
          <Music className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-1">No tracks yet</h3>
          <p className="text-white/40 text-sm mb-6">Upload your first track to build your music portfolio!</p>
          <button onClick={() => setAddModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <Upload className="w-4 h-4" /> Upload Your First Track
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                exit={{ opacity: 0, x: -50 }}
                layout
                className={`group flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  playingId === track.id
                    ? 'bg-blue-600/10 border-blue-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                }`}
              >
                <button
                  onClick={() => togglePlay(track.id)}
                  className={`p-2.5 rounded-xl transition-colors ${
                    playingId === track.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {playingId === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${playingId === track.id ? 'text-blue-400' : 'text-white'}`}>{track.title}</p>
                  <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {track.artist}</span>
                    <span>{track.genre}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-white/40"><Clock className="w-3 h-3" /> {track.duration}</span>
                  <button onClick={() => deleteTrack(track.id)} className="p-1.5 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
