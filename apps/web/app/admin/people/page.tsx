'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Building2, UserPlus, Ban, Search, Eye, Trash2, AlertTriangle, X, ChevronLeft, ChevronRight, Shield, UserCheck, UserX, Clock, Mail, Calendar } from 'lucide-react'
import { storage } from '@/lib/storage'
import { auditLogger } from '@/lib/security'

type Role = 'customer' | 'provider' | 'admin'

interface AppUser {
  id: string
  fullName?: string
  name?: string
  email: string
  role?: Role
  userType?: string
  status?: 'active' | 'suspended' | 'banned'
  createdAt?: string
  joinedDate?: string
  avatar?: string
  phone?: string
}

export default function AdminPeoplePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>}>
      <AdminPeopleContent />
    </Suspense>
  )
}

function AdminPeopleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [admin, setAdmin] = useState<any>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [providers, setProviders] = useState<AppUser[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const perPage = 10

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data?type=users', { signal: AbortSignal.timeout(8000) })
      const json = await res.json()
      if (!mountedRef.current) return
      if (json?.data?.length > 0) {
        const apiUsers = json.data
        const apiCustomers = apiUsers.filter((u: any) => u.userType !== 'provider')
        const apiProviders = apiUsers.filter((u: any) => u.userType === 'provider')
        setUsers(apiCustomers)
        setProviders(apiProviders)
        storage.set('registered_users', apiCustomers)
        storage.set('registered_providers', apiProviders)
      }
    } catch {
      // silently keep current state
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') { router.push('/login'); return }
    setAdmin(currentAdmin)

    // Load cached data instantly, then refresh from API
    const registered = storage.get('registered_users') || []
    const registeredProviders = storage.get('registered_providers') || []
    setUsers(registered)
    setProviders(registeredProviders)

    refreshUsers()

    return () => {
      window.removeEventListener('error', errorHandler)
      mountedRef.current = false
    }
  }, [router, refreshUsers])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const allPeople: AppUser[] = [
    ...users.map((u: any) => ({
      ...u,
      role: (u.role || u.userType || 'customer') as Role,
      status: u.isSuspended ? 'suspended' : (u.status || 'active')
    })),
    ...providers.map((p: any) => ({
      ...p,
      role: (p.role || p.userType || 'provider') as Role,
      status: p.isSuspended ? 'suspended' : (p.status || 'active')
    })),
  ]

  const filtered = allPeople.filter(p => {
    const name = (p.fullName || p.name || '').toLowerCase()
    const email = (p.email || '').toLowerCase()
    const term = search.toLowerCase()
    const matchesSearch = !search || name.includes(term) || email.includes(term)

    if (activeTab === 'all') return matchesSearch && p.role !== 'admin'
    if (activeTab === 'providers') return matchesSearch && (p.role === 'provider' || p.userType === 'provider')
    if (activeTab === 'customers') return matchesSearch && (p.role === 'customer' || p.userType === 'customer' || (!p.role && !p.userType))
    if (activeTab === 'admins') return matchesSearch && (p.role === 'admin' || p.userType === 'admin')
    return matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const newToday = allPeople.filter(p => {
    const d = p.createdAt || p.joinedDate || ''
    return d && new Date(d).toDateString() === new Date().toDateString()
  }).length

  const banned = allPeople.filter(p => p.status === 'banned').length

  const summaryStats = [
    { icon: Users, label: 'Total Users', value: allPeople.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Building2, label: 'Providers', value: providers.length.toString(), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: UserPlus, label: 'New Today', value: newToday.toString(), color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: Ban, label: 'Banned', value: banned.toString(), color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  const tabs = [
    { id: 'all', label: 'All Users', count: allPeople.filter(p => p.role !== 'admin').length },
    { id: 'providers', label: 'Providers', count: providers.length },
    { id: 'customers', label: 'Customers', count: users.filter((u: any) => (u.role || u.userType || 'customer') !== 'provider').length },
    { id: 'admins', label: 'Admins', count: allPeople.filter(p => p.role === 'admin' || p.userType === 'admin').length },
  ]

  const handleSuspend = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action: 'toggle_suspend' }),
      })
      const json = await res.json()
      if (json.success) {
        await refreshUsers()
        const target = allPeople.find(u => u.id === userId)
        if (target) {
          auditLogger.log(json.action === 'suspend' ? 'suspend' : 'unsuspend', userId, admin?.email || 'Admin', `${json.action === 'suspend' ? 'Suspended' : 'Unsuspended'} user ${target.fullName || target.name || target.email || userId}`)
        }
      }
    } catch {
      // ignore
    }
    setActionLoading(null)
  }

  const handleDelete = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })
      const json = await res.json()
      if (json.success) {
        const target = allPeople.find(u => u.id === userId)
        await refreshUsers()
        if (target) {
          auditLogger.log('delete', userId, admin?.email || 'Admin', `Deleted user ${target.fullName || target.name || target.email || userId}`)
        }
      }
    } catch {
      // ignore
    }
    setConfirmDelete(null)
    setActionLoading(null)
  }

  const getStatusBadge = (status?: string) => {
    if (status === 'suspended') return { label: 'Suspended', class: 'bg-yellow-500/20 text-yellow-400' }
    if (status === 'banned') return { label: 'Banned', class: 'bg-red-500/20 text-red-400' }
    return { label: 'Active', class: 'bg-green-500/20 text-green-400' }
  }

  const getRoleIcon = (role?: string) => {
    if (role === 'provider' || role === 'admin') return <Shield className="w-4 h-4 text-purple-400" />
    return <UserCheck className="w-4 h-4 text-blue-400" />
  }

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-bold text-white">People Management</h1>
        <p className="text-white/60 mt-1">Manage users, providers, and admins</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-white/40" />
            </div>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentPage(1) }} className={`px-3 py-1.5 rounded-md text-sm transition-all ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>
                  {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">User</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Email</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Role</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Status</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Joined</th>
                <th className="text-right text-xs text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/40">No users found</td>
                </tr>
              ) : paginated.map((person, i) => {
                const statusBadge = getStatusBadge(person.status)
                const joined = person.createdAt || person.joinedDate || ''
                const isLoading = actionLoading === person.id
                return (
                  <motion.tr key={person.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="group hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                          {(person.fullName || person.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{person.fullName || person.name || 'Unnamed'}</p>
                          <p className="text-xs text-white/40">{person.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-sm text-white/70">{person.email || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(person.role || person.userType)}
                        <span className="text-sm capitalize text-white/70">{person.role || person.userType || 'customer'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.class}`}>{statusBadge.label}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-sm text-white/60">{joined ? new Date(joined).toLocaleDateString() : '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedUser(person)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View Profile" disabled={isLoading}>
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                        <button onClick={() => handleSuspend(person.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title={person.status === 'suspended' ? 'Unsuspend' : 'Suspend'} disabled={isLoading}>
                          <UserX className={`w-4 h-4 ${isLoading ? 'text-white/20 animate-spin' : 'text-yellow-400'}`} />
                        </button>
                        <button onClick={() => setConfirmDelete(person.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Delete" disabled={isLoading}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-white/40">{filtered.length} total users</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-white" /></button>
              <span className="text-sm text-white/60">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4 text-white" /></button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Delete</h3>
                <p className="text-sm text-white/60">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-6">Are you sure you want to permanently delete this user and all associated data?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={actionLoading === confirmDelete} className="flex-1 px-4 py-2 bg-red-500 rounded-lg text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-50">
                {actionLoading === confirmDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">User Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white mb-3">
                {(selectedUser.fullName || selectedUser.name || 'U')[0].toUpperCase()}
              </div>
              <p className="text-lg font-bold text-white">{selectedUser.fullName || selectedUser.name || 'Unnamed'}</p>
              <p className="text-sm text-white/60">{selectedUser.email}</p>
              <span className={`mt-2 text-xs px-3 py-1 rounded-full font-medium ${getStatusBadge(selectedUser.status).class}`}>{getStatusBadge(selectedUser.status).label}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-white/40">Role</span><span className="text-white capitalize">{selectedUser.role || selectedUser.userType || 'customer'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Phone</span><span className="text-white">{selectedUser.phone || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Joined</span><span className="text-white">{selectedUser.createdAt || selectedUser.joinedDate ? new Date(selectedUser.createdAt || selectedUser.joinedDate).toLocaleDateString() : '—'}</span></div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
