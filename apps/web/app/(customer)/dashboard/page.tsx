'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, ShoppingCart, Heart, User, LogOut, Star, MapPin, Clock, CreditCard,
  ArrowUpRight, ArrowDownLeft, Trash2, Bell, Shield, Mail, Phone, Key,
  ChevronDown, X, Check, Save, AlertTriangle
} from 'lucide-react'
import { storage } from '../../../lib/storage'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '\uD83D\uDCCA' },
  { id: 'orders', label: 'My Orders', icon: '\uD83D\uDCE6' },
  { id: 'wallet', label: 'Wallet', icon: '\uD83D\uDCB0' },
  { id: 'favorites', label: 'Favorites', icon: '\u2764\uFE0F' },
  { id: 'profile', label: 'Profile', icon: '\uD83D\uDC64' },
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] as any[] })
  const [orders, setOrders] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [toast, setToast] = useState('')

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [notifications, setNotifications] = useState({ email: true, sms: false, promotions: true })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser) { router.push('/login'); return }
    setUser(currentUser)
    setWallet(storage.getWallet() || { balance: 0, transactions: [] })
    setOrders(storage.get('user_orders') || [])
    setFavorites(storage.get('user_favorites') || [])
    setProfile({
      name: currentUser.user_metadata?.full_name || currentUser.fullName || currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
    })
  }, [router])

  const handleLogout = () => { storage.clearUser(); router.push('/') }

  const handleAddFunds = () => {
    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) return
    const updated = {
      balance: wallet.balance + amount,
      transactions: [
        { id: `tx_${Date.now()}`, type: 'credit', amount, description: 'Funds added', date: new Date().toISOString() },
        ...wallet.transactions,
      ],
    }
    setWallet(updated)
    storage.setWallet(updated)
    setShowAddFunds(false)
    setFundAmount('')
    showToast(`\u20A6${amount.toLocaleString()} added to wallet`)
  }

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id)
    setFavorites(updated)
    storage.set('user_favorites', updated)
  }

  const handleSaveProfile = () => {
    showToast('Profile updated successfully')
  }

  const handleChangePassword = () => {
    if (passwords.newPass !== passwords.confirm) { showToast('Passwords do not match'); return }
    showToast('Password changed successfully')
    setPasswords({ current: '', newPass: '', confirm: '' })
  }

  const handleDeleteAccount = () => {
    storage.clearAll()
    router.push('/')
  }

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId)
    setOrders(updated)
    storage.set('user_orders', updated)
    showToast('Order cancelled')
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>

  return (
    <div className="w-full text-white overflow-x-hidden" suppressHydrationWarning>
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

      <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h1 className="text-2xl font-bold">Welcome, {user.user_metadata?.full_name || user.fullName || user.name}!</h1>
          <p className="text-white/60 mt-1">Manage your services and profile</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-white/10 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div className="grid md:grid-cols-3 gap-6 mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <motion.div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm" whileHover={{ y: -4 }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Wallet Balance</p>
                  <p className="text-3xl font-bold mt-2">&#x20A6;{wallet.balance.toLocaleString()}</p>
                  <p className="text-xs text-white/40 mt-1">{wallet.transactions.length} transactions</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </motion.div>
            <motion.div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm" whileHover={{ y: -4 }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Pending Orders</p>
                  <p className="text-3xl font-bold mt-2">{orders.filter(o => o.status !== 'completed').length}</p>
                  <p className="text-xs text-white/40 mt-1">{orders.length} total orders</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-orange-400 opacity-50" />
              </div>
            </motion.div>
            <motion.div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm" whileHover={{ y: -4 }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/60 text-sm">Saved Services</p>
                  <p className="text-3xl font-bold mt-2">{favorites.length}</p>
                  <p className="text-xs text-white/40 mt-1">in your favorites</p>
                </div>
                <Heart className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </motion.div>

            {/* Recent Activity */}
            <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {orders.slice(0, 3).map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'completed' ? 'bg-green-400' :
                        order.status === 'in-progress' ? 'bg-blue-400' : 'bg-yellow-400'
                      }`} />
                      <div>
                        <p className="font-medium">{order.service}</p>
                        <p className="text-sm text-white/40">{order.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">&#x20A6;{order.amount.toLocaleString()}</p>
                      <p className="text-xs text-white/40 capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div className="space-y-4 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-xl font-bold">No orders yet</p>
                <p className="text-white/60 mt-2">Browse services to place your first order</p>
                <Link href="/search" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
                  Browse Services
                </Link>
              </div>
            ) : (
              orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{order.service}</h3>
                          <p className="text-white/60 text-sm">{order.provider}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 text-sm text-white/40">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(order.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />Online</span>
                      </div>
                      {order.status === 'completed' && order.rating > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={`w-4 h-4 ${s < order.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-2xl font-bold">&#x20A6;{order.amount.toLocaleString()}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status === 'in-progress' ? 'In Progress' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <motion.div className="space-y-6 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-xl p-8" whileHover={{ scale: 1.01 }}>
              <p className="text-blue-100 text-sm font-medium">Available Balance</p>
              <p className="text-5xl font-bold mt-2">&#x20A6;{wallet.balance.toLocaleString()}</p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowAddFunds(true)}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" /> Add Funds
                </button>
                <button className="border-2 border-white/50 text-white px-6 py-2 rounded-lg font-semibold hover:border-white transition flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4" /> Withdraw
                </button>
              </div>
            </motion.div>

            {/* Add Funds Modal */}
            <AnimatePresence>
              {showAddFunds && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAddFunds(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Add Funds</h3>
                      <button onClick={() => setShowAddFunds(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 mb-4"
                    />
                    <div className="flex gap-2 mb-4">
                      {[5000, 10000, 25000, 50000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setFundAmount(amt.toString())}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition"
                        >&#x20A6;{amt.toLocaleString()}</button>
                      ))}
                    </div>
                    <button
                      onClick={handleAddFunds}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >Add Funds</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transaction History */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Transaction History</h3>
              {wallet.transactions.length === 0 ? (
                <p className="text-white/40 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {wallet.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {tx.type === 'credit'
                            ? <ArrowUpRight className={`w-5 h-5 text-green-400`} />
                            : <ArrowDownLeft className={`w-5 h-5 text-red-400`} />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-white/40">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}&#x20A6;{tx.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            {favorites.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-xl font-bold">No favorites yet</p>
                <p className="text-white/60 mt-2">Save services you love for quick access</p>
                <Link href="/search" className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
                  Browse Services
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {favorites.map((fav, i) => (
                  <motion.div
                    key={fav.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 relative">
                      <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                        {fav.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold">{fav.title}</h3>
                      <p className="text-white/60 text-sm mt-1">{fav.provider}</p>
                      <div className="flex items-center mt-2 gap-1">
                        {[...Array(5)].map((_, s) => (
                          <Star key={s} className={`w-4 h-4 ${s < Math.floor(fav.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                        ))}
                        <span className="text-sm text-white/60 ml-2">{fav.rating}</span>
                      </div>
                      <p className="text-2xl font-bold mt-4">&#x20A6;{fav.price.toLocaleString()}</p>
                      <div className="flex gap-2 mt-4">
                        <Link
                          href={`/book-service/${fav.id}`}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold text-center hover:bg-blue-700 transition"
                        >
                          Book Now
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div className="space-y-8 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Profile Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                  {(user.user_metadata?.full_name || user.fullName)?.charAt(0) || user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user.user_metadata?.full_name || user.fullName || user.name}</h3>
                  <p className="text-white/60 text-sm">{user.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1"><User className="w-4 h-4 inline mr-1" />Full Name</label>
                  <input
                    value={profile.name}
                    onChange={e => setProfile(s => ({ ...s, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1"><Mail className="w-4 h-4 inline mr-1" />Email</label>
                  <input
                    value={profile.email}
                    onChange={e => setProfile(s => ({ ...s, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1"><Phone className="w-4 h-4 inline mr-1" />Phone</label>
                  <input
                    value={profile.phone}
                    onChange={e => setProfile(s => ({ ...s, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-400" /> Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
                  { key: 'promotions', label: 'Promotional Emails', desc: 'Receive offers and promotions' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(s => ({ ...s, [item.key]: !(s as any)[item.key] }))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        (notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        (notifications as any)[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-blue-400" /> Change Password</h3>
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwords.current}
                  onChange={e => setPasswords(s => ({ ...s, current: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwords.newPass}
                  onChange={e => setPasswords(s => ({ ...s, newPass: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(s => ({ ...s, confirm: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40"
                />
                <button
                  onClick={handleChangePassword}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
              <p className="text-white/60 text-sm mt-2">Permanently delete your account and all associated data</p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Delete Account
              </button>
            </div>

            {/* Delete Confirmation */}
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
                    <p className="text-white/60 text-center mb-6">This action cannot be undone. All your data will be permanently deleted.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/20 transition">Cancel</button>
                      <button onClick={handleDeleteAccount} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">Delete</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
