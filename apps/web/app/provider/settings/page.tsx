'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Bell, CreditCard, Key, Trash2, User, Phone, Mail, MapPin, Check } from 'lucide-react'
import { storage } from '@/lib/storage'

interface ProviderSettings {
  businessName: string
  description: string
  email: string
  phone: string
  address: string
  notifications: { email: boolean; sms: boolean; push: boolean }
  bankAccount: string
  bankCode: string
  bankName: string
  accountName: string
}

const defaultSettings: ProviderSettings = {
  businessName: '',
  description: '',
  email: '',
  phone: '',
  address: '',
  notifications: { email: true, sms: false, push: true },
  bankAccount: '',
  bankCode: '',
  bankName: '',
  accountName: '',
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white shadow-2xl"
    >
      <Check className="w-4 h-4" /> {message}
    </motion.div>
  )
}

export default function ProviderSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<ProviderSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [loading, setLoading] = useState(true)

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

    const saved = storage.get('provider_settings')
    if (saved) {
      setSettings({ ...defaultSettings, ...saved })
    } else {
      setSettings({
        businessName: currentUser.user_metadata?.full_name || currentUser.fullName || currentUser.name || 'My Business',
        description: 'Professional beauty and wellness services.',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: '',
        notifications: { email: true, sms: false, push: true },
        bankAccount: '',
        bankCode: '',
        bankName: '',
        accountName: '',
      })
    }

    fetch('/api/provider/payment-settings')
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setSettings(prev => ({
            ...prev,
            bankAccount: res.data.accountNumber || prev.bankAccount,
            bankCode: res.data.bankCode || prev.bankCode,
            bankName: res.data.bankName || prev.bankName,
            accountName: res.data.accountName || prev.accountName,
          }))
        }
      })
      .catch(() => {})

    setLoading(false)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

  const saveSettings = useCallback(async () => {
    setSaving(true)
    storage.set('provider_settings', settings)
    try {
      await fetch('/api/provider/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: settings.bankCode,
          accountNumber: settings.bankAccount,
          accountName: settings.accountName,
          bankName: settings.bankName,
        }),
      })
    } catch {}
    setTimeout(() => { setSaving(false); showToast('Settings saved successfully!') }, 500)
  }, [settings, showToast])

  const toggleNotif = useCallback((key: keyof typeof settings.notifications) => {
    setSettings(s => ({ ...s, notifications: { ...s.notifications, [key]: !s.notifications[key] } }))
  }, [])

  if (!user) return null

  return (
    <div className="space-y-6 max-w-3xl" suppressHydrationWarning>
      <Toast message={toast.message} visible={toast.visible} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/50 mt-1">Business profile and account settings</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-40 mb-4" />
              <div className="space-y-3"><div className="h-10 bg-white/10 rounded-xl" /><div className="h-10 bg-white/10 rounded-xl" /></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><User className="w-5 h-5 text-blue-400" /> Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Business Name</label>
                <input value={settings.businessName} onChange={e => setSettings(s => ({ ...s, businessName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={settings.phone} onChange={e => setSettings(s => ({ ...s, phone: e.target.value }))} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/60 mb-1">Description</label>
                <textarea value={settings.description} onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-20" />
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-amber-400" /> Notification Preferences</h2>
            <div className="space-y-3">
              {[
                { key: 'email' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'sms' as const, label: 'SMS Notifications', desc: 'Receive text message alerts' },
                { key: 'push' as const, label: 'Push Notifications', desc: 'Browser push notifications' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div><p className="text-white text-sm">{label}</p><p className="text-white/40 text-xs">{desc}</p></div>
                  <button
                    onClick={() => toggleNotif(key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifications[key] ? 'bg-blue-600' : 'bg-white/20'}`}
                  >
                    <motion.div animate={{ x: settings.notifications[key] ? 24 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-emerald-400" /> Payment Settings</h2>
            <p className="text-white/40 text-xs mb-4">These details will be pre-filled when you request a payout.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/60 mb-1">Account Name</label>
                <input value={settings.accountName} onChange={e => setSettings(s => ({ ...s, accountName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Bank Name</label>
                <input value={settings.bankName} onChange={e => setSettings(s => ({ ...s, bankName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="GTBank" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Bank Code</label>
                <input value={settings.bankCode} onChange={e => setSettings(s => ({ ...s, bankCode: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="e.g. 044" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Account Number</label>
                <input value={settings.bankAccount} onChange={e => setSettings(s => ({ ...s, bankAccount: e.target.value }))} maxLength={10} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="0123456789" />
              </div>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4"><Key className="w-5 h-5 text-red-400" /> Account Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: user?.email }),
                    })
                    const data = await res.json()
                    if (data.success || res.ok) {
                      showToast('Password reset email sent! Check your inbox.')
                    } else {
                      showToast('Failed to send reset email. Try again later.')
                    }
                  } catch {
                    showToast('Failed to send reset email.')
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm"
              >Change Password</button>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
                  try {
                    const res = await fetch('/api/admin/data', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ table: 'users', id: user?.id }),
                    })
                    if (res.ok) {
                      storage.clearUser()
                      storage.clearToken()
                      showToast('Account deleted.')
                      setTimeout(() => router.push('/'), 1500)
                    } else {
                      showToast('Failed to delete account.')
                    }
                  } catch {
                    showToast('Failed to delete account.')
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm flex items-center gap-2"
              ><Trash2 className="w-4 h-4" /> Delete Account</button>
            </div>
          </motion.div>

          {/* Save */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}
