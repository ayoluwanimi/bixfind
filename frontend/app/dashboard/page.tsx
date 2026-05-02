'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, Wallet, User, LogOut, Star, MapPin, Clock, Globe, Layout, Palette, Share2, Upload, Menu, X, ChevronDown } from 'lucide-react'
import { storage } from '../../lib/storage'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'orders', label: 'My Orders', icon: '📦' },
  { id: 'wallet', label: 'Wallet', icon: '💰' },
  { id: 'favorites', label: 'Favorites', icon: '❤️' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] })
  const [orders, setOrders] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    setUser(currentUser)

    setWallet(storage.getWallet() || { balance: 0, transactions: [] })

    // Load real orders from storage or API
    const savedOrders = storage.get('user_orders') || []
    setOrders(savedOrders)

    // Load real favorites from storage or API
    const savedFavorites = storage.get('user_favorites') || []
    setFavorites(savedFavorites)
  }, [router])

  const handleLogout = () => {
    storage.clearUser()
    router.push('/')
  }

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <div>
              <div className="text-2xl font-bold text-blue-600">BIXFIND</div>
              <span className="text-xs text-gray-600">Customer</span>
            </div>
          </a>
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Welcome, {user.fullName}!</h1>
          <p className="text-gray-600 mt-2">Manage your services and profile</p>
        </div>

        {/* Tabs - Mobile Dropdown + Desktop Tabs */}
        <div className="mb-8">
          {/* Mobile: Dropdown */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <span className="font-semibold">{tabs.find(t => t.id === activeTab)?.label}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                      activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden md:flex gap-1 mb-8 border-b border-gray-200 bg-white rounded-t-lg px-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-semibold flex gap-2 items-center border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Wallet Balance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₦{wallet.balance.toLocaleString()}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{orders.filter(o => o.status !== 'completed').length}</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Saved Services</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{favorites.length}</p>
                </div>
                <Heart className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.service}</h3>
                    <p className="text-gray-600 mt-1">{order.provider}</p>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₦{order.amount.toLocaleString()}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg shadow p-8">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-5xl font-bold mt-2">₦{wallet.balance.toLocaleString()}</p>
              <div className="flex gap-4 mt-6">
                <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
                  Add Funds
                </button>
                <button className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
                  Withdraw
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
              <p className="text-gray-600">No transactions yet</p>
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="grid md:grid-cols-2 gap-6">
            {favorites.map(fav => (
              <div key={fav.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{fav.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{fav.provider}</p>
                  <div className="flex items-center mt-2 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(fav.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">{fav.rating}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-4">₦{fav.price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
                      Book Now
                    </button>
                    <button className="flex-1 bg-red-100 text-red-600 py-2 rounded font-semibold hover:bg-red-200">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Website Builder Tab */}
        {activeTab === 'website' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Create Your Mini Website</h2>
                  <p className="text-white/90 mb-6">
                    Build a professional mini website for your business. Choose from beautiful templates, 
                    customize your design, and share your unique URL with customers.
                  </p>
                  <Link 
                    href="/website-builder"
                    className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    <Globe className="w-5 h-5" />
                    Go to Website Builder
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/20 rounded-xl flex items-center justify-center">
                    <Layout className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Upload Your Logo</h3>
                <p className="text-sm text-gray-600">Add your brand logo to make your website recognizable</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Customize Design</h3>
                <p className="text-sm text-gray-600">Choose colors, fonts, and layouts that match your brand</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Share Your URL</h3>
                <p className="text-sm text-gray-600">Get a unique URL based on your company name</p>
              </div>
            </div>

            {storage.getMiniWebsites().length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="font-semibold text-lg">Your Websites</h3>
                </div>
                <div className="divide-y">
                  {storage.getMiniWebsites().map((site: any) => (
                    <div key={site.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {site.logoUrl && (
                          <img src={site.logoUrl} alt={site.displayName} className="w-12 h-12 rounded" />
                        )}
                        <div>
                          <h4 className="font-semibold">{site.displayName}</h4>
                          <p className="text-sm text-gray-500">
                            /site/{site.companyName.toLowerCase().replace(/\s+/g, '-')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          site.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {site.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <Link
                          href="/website-builder"
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                        >
                          Edit
                        </Link>
                        <a
                          href={`/w/${site.companyName.toLowerCase().replace(/\s+/g, '-')}`}
                          target="_blank"
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" defaultValue={user.fullName} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" defaultValue={user.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" defaultValue={user.phone} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" placeholder="123 Main St" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
