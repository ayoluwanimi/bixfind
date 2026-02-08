'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wallet, TrendingUp, Package, BarChart3, LogOut, Plus, Edit2, Trash2 } from 'lucide-react'
import { storage } from '../../lib/storage'

export default function ProviderDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] })
  const [services, setServices] = useState<any[]>([])
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [newService, setNewService] = useState({ title: '', price: '', description: '' })

  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser || currentUser.userType !== 'provider') {
      router.push('/auth/login')
      return
    }
    setUser(currentUser)

    // Load provider data
    const savedWallet = storage.getWallet()
    setWallet(savedWallet || { balance: 0, transactions: [] })

    const savedServices = storage.getServices()
    setServices(savedServices || [
      { id: 1, title: 'Web Design', price: 500, description: 'Professional website design', views: 45, active: true },
      { id: 2, title: 'App Development', price: 1500, description: 'Custom app development', views: 32, active: true },
    ])
  }, [router])

  const handleLogout = () => {
    storage.clearUser()
    router.push('/')
  }

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newService.title || !newService.price) return

    const service = {
      id: Date.now(),
      ...newService,
      price: parseFloat(newService.price),
      views: 0,
      active: true,
    }

    const updated = [...services, service]
    setServices(updated)
    storage.setServices(updated)
    setNewService({ title: '', price: '', description: '' })
    setShowServiceForm(false)
  }

  const handleDeleteService = (id: number) => {
    const updated = services.filter(s => s.id !== id)
    setServices(updated)
    storage.setServices(updated)
  }

  const totalEarnings = wallet.transactions
    .filter((t: any) => t.type === 'earnings')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <div>
              <div className="text-2xl font-bold text-blue-600">BIXFIND</div>
              <span className="text-xs text-gray-600">Provider</span>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {user.fullName}!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'services', label: 'Services', icon: '📦' },
            { id: 'sales', label: 'Sales Tracking', icon: '📈' },
            { id: 'wallet', label: 'Wallet', icon: '💰' },
            { id: 'website', label: 'Mini Website', icon: '🌐' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 font-semibold flex gap-2 items-center border-b-2 transition ${
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${totalEarnings}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Wallet Balance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${wallet.balance}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Active Services</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{services.length}</p>
                </div>
                <Package className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">Total Views</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{services.reduce((s, sv) => s + sv.views, 0)}</p>
                </div>
                <BarChart3 className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <button
              onClick={() => setShowServiceForm(!showServiceForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>

            {showServiceForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Service</h3>
                <form onSubmit={handleAddService} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
                    <input
                      type="text"
                      value={newService.title}
                      onChange={(e) => setNewService({...newService, title: e.target.value})}
                      placeholder="e.g., Web Design"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      placeholder="Describe your service"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                  >
                    Create Service
                  </button>
                </form>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {services.map(service => (
                <div key={service.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <p className="text-gray-600"><span className="font-semibold">Price:</span> ${service.price}</p>
                    <p className="text-gray-600"><span className="font-semibold">Views:</span> {service.views}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 bg-blue-100 text-blue-600 py-2 rounded font-semibold hover:bg-blue-200 flex items-center justify-center gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="flex-1 bg-red-100 text-red-600 py-2 rounded font-semibold hover:bg-red-200 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg shadow p-8">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-5xl font-bold mt-2">${wallet.balance}</p>
              <button className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
                Withdraw Funds
              </button>
            </div>
          </div>
        )}

        {/* Website Tab */}
        {activeTab === 'website' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="border-l-4 border-blue-600 bg-blue-50 p-6 rounded mb-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Mini Website Builder</h3>
              <p className="text-blue-800">
                Your provider URL: <code className="font-mono bg-white px-2 py-1 rounded">provider-{user.id}.bixfind.app</code>
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              Launch Website Builder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
