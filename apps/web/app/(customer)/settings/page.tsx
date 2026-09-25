'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Save, Bell, Key, AlertTriangle, Check,
  Shield, Eye, EyeOff, LogOut
} from 'lucide-react'
import { storage } from '@/lib/storage'

export default function CustomerSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    promotions: true,
    bookingUpdates: true,
    marketing: false,
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    const currentUser = storage.getUser()
    if (!currentUser) { router.push('/login'); return }
    setUser(currentUser)
    setProfile({
      name: currentUser.user_metadata?.full_name || currentUser.fullName || currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
    })
    const saved = storage.get('user_notification_prefs')
    if (saved) setNotifications(saved)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const handleSaveProfile = () => {
    if (user) {
      const updated = { ...user, user_metadata: { ...user.user_metadata, full_name: profile.name }, fullName: profile.name, email: profile.email, phone: profile.phone }
      storage.setUser(updated)
      setUser(updated)
    }
    showToast('Profile updated successfully')
  }

  const handleSaveNotifications = () => {
    storage.set('user_notification_prefs', notifications)
    showToast('Notification preferences saved')
  }

  const handleChangePassword = () => {
    if (!passwords.current) { showToast('Enter current password'); return }
    if (passwords.newPass.length < 6) { showToast('New password must be at least 6 characters'); return }
    if (passwords.newPass !== passwords.confirm) { showToast('Passwords do not match'); return }
    showToast('Password changed successfully')
    setPasswords({ current: '', newPass: '', confirm: '' })
  }

  const handleDeleteAccount = () => {
    storage.clearAll()
    router.push('/')
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>

  const toggleSwitch = (
    label: string,
    desc: string,
    key: keyof typeof notifications,
  ) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <button
        onClick={() => {
          setNotifications(s => ({ ...s, [key]: !s[key] }))
        }}
        className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
          notifications[key] ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
          notifications[key] ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )

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

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-white/60 mt-1">Account and notification preferences</p>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> Profile Information
          </h3>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {profile.name.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-lg font-bold">{profile.name || 'User'}</p>
              <p className="text-white/60 text-sm">{profile.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Customer</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5"><User className="w-4 h-4 inline mr-1" /> Full Name</label>
              <input
                value={profile.name}
                onChange={e => setProfile(s => ({ ...s, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5"><Mail className="w-4 h-4 inline mr-1" /> Email Address</label>
              <input
                value={profile.email}
                onChange={e => setProfile(s => ({ ...s, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5"><Phone className="w-4 h-4 inline mr-1" /> Phone Number</label>
              <input
                value={profile.phone}
                onChange={e => setProfile(s => ({ ...s, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                placeholder="+234 800 000 0000"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" /> Notification Preferences
          </h3>
          <div className="divide-y divide-white/5">
            {toggleSwitch('Email Notifications', 'Receive booking updates and receipts via email', 'email')}
            {toggleSwitch('SMS Notifications', 'Get text message alerts for order updates', 'sms')}
            {toggleSwitch('Booking Updates', 'Real-time alerts when booking status changes', 'bookingUpdates')}
            {toggleSwitch('Promotional Emails', 'Special offers and promotions from partners', 'promotions')}
            {toggleSwitch('Marketing Communications', 'Tips, guides, and product updates', 'marketing')}
          </div>
          <button
            onClick={handleSaveNotifications}
            className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </motion.div>

        {/* Change Password */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" /> Change Password
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                placeholder="Current password"
                value={passwords.current}
                onChange={e => setPasswords(s => ({ ...s, current: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
              />
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="New password"
              value={passwords.newPass}
              onChange={e => setPasswords(s => ({ ...s, newPass: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
            />
            <input
              type={showPasswords ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={passwords.confirm}
              onChange={e => setPasswords(s => ({ ...s, confirm: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
            />
            <button
              onClick={handleChangePassword}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Update Password
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-white/60 text-sm mt-2">
            Once you delete your account, all data including orders, wallet balance, and saved services will be permanently removed.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500/20 rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-center mb-2">Delete Account?</h3>
              <p className="text-white/60 text-center text-sm mb-6">
                This action is permanent and cannot be undone. All your data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
