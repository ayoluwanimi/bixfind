'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { 
  Users, Building2, CreditCard, MessageSquare, Settings, BarChart3, Activity,
  Shield, AlertTriangle, CheckCircle, XCircle, Trash2, Edit, Eye, Ban, Check,
  X, Loader2, Search, Filter, Download, RefreshCw, Mail, Phone, Globe,
  ChevronDown, ChevronRight, Bell, Zap, TrendingUp, TrendingDown, DollarSign,
  Calendar, FileText, Image, Layout as LayoutIcon, Palette, EyeOff, ToggleLeft,
  ToggleRight, MoreVertical, ExternalLink, LogOut, AlertCircle, Package, Save
} from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'
import { realtimeDb, trackActivity, saveHomepageSnapshot } from '@/lib/realtime'
import { createAuditLog, getCSRFToken } from '@/lib/security'

const API_BASE = 'https://api-eal2ibekhq-uc.a.run.app'

// Track admin action for audit
const trackAdminAction = async (admin: any, action: string, details: string) => {
  try {
    const auditLog = createAuditLog(action, admin?.id || 'unknown', admin?.fullName || 'Admin', details)
    await realtimeDb.push('adminAudit', auditLog)
    console.log('Audit log:', action, details)
  } catch (e) {
    console.error('Failed to track admin action:', e)
  }
}

interface User {
  id: string
  email: string
  fullName: string
  phone: string
  userType: string
  isVerified: boolean
  isActive: boolean
  isSuspended: boolean
  createdAt: string
}

interface Provider {
  id: string
  businessName: string
  ownerName: string
  email: string
  category: string
  rating: number
  isVerified: boolean
  isActive: boolean
  services: number
  revenue: number
  createdAt: string
}

interface Transaction {
  id: string
  userId: string
  userName: string
  type: string
  amount: number
  description: string
  status: string
  reference: string
  createdAt: string
}

interface Ticket {
  id: string
  userId: string
  userName: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
}

interface Website {
  id: string
  companyName: string
  displayName: string
  userId: string
  ownerName: string
  templateId: string
  isPublished: boolean
  isActive: boolean
  views: number
  createdAt: string
}

interface PlatformSetting {
  id: string
  key: string
  value: string
  description: string
  isPublic: boolean
}

interface ActivityLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId?: string
  details: any
  timestamp: number
}

// Security: Sanitize input to prevent XSS
const sanitizeInput = (str: string): string => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 500)
}

export default function EnhancedAdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false) // Start as false - load from cache first
  const [loadError, setLoadError] = useState<string | null>(null)
  const [admin, setAdmin] = useState<any>(null)
  
  // Initialize users from cache (instant display)
  const [users, setUsers] = useState<User[]>(() => storage.get('admin_users') || [])
  const [providers, setProviders] = useState<Provider[]>(() => storage.get('admin_providers') || [])
  const [websites, setWebsites] = useState<Website[]>(() => storage.get('admin_websites') || [])
  const [comments, setComments] = useState<any[]>(() => storage.get('admin_comments') || [])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>(() => storage.get('admin_activities') || [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  
// Initialize stats from cached data (instant display)
  const [stats, setStats] = useState(() => {
    const cached = storage.get('admin_stats')
    return cached || {
      totalUsers: 0,
      activeUsers: 0,
      totalProviders: 0,
      verifiedProviders: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingTickets: 0,
      activeWebsites: 0,
      totalWebsites: 0,
      platformUptime: 99.9,
      newUsersToday: 0,
      newProvidersToday: 0
    }
  })

  // Featured providers state
  const [featuredSettings, setFeaturedSettings] = useState({
    isActive: true,
    maxProviders: 8,
    autoRotate: true,
    featuredIds: [] as string[]
  })
  const [savingFeatured, setSavingFeatured] = useState(false)
  const [savingHomepage, setSavingHomepage] = useState(false)
  const [featuredSearchTerm, setFeaturedSearchTerm] = useState('')
  const [featuredCategoryFilter, setFeaturedCategoryFilter] = useState('all')

  // Helper to get category from user data - defined before useEffect
  const getCategoryFromUser = (u: any, website?: any): string => {
    const servicesList = website?.sectionContent?.servicesContent?.split('\n').filter((s: string) => s.trim()) || []
    
    const sources = [
      u.category,
      servicesList[0],
      u.service,
      u.serviceType,
      u.niche,
      u.specialization,
      u.businessName,
      u.description,
      u.bio,
      u.address,
      website?.sectionContent?.heroTitle,
      website?.tagline
    ]
    
    for (const src of sources) {
      if (src && src !== 'General' && src !== 'Service Provider' && typeof src === 'string' && src.trim()) {
        return src.trim()
      }
    }
    
    const content = [
      u.fullName, u.businessName, u.email, u.description, u.bio,
      u.address, u.whatsapp, u.instagram, u.twitter,
      website?.sectionContent?.servicesContent,
      website?.sectionContent?.aboutContent,
      website?.sectionContent?.heroTitle,
      website?.tagline
    ].filter(Boolean).join(' ').toLowerCase()
    
    const keywords: Record<string, string[]> = {
      'Plumbing': ['plumb', 'pipe', 'water', 'drain', 'leak', 'bathroom', 'toilet', 'sink', 'faucet'],
      'Electrical': ['electric', 'wiring', 'light', 'power', 'switch', 'socket', 'fan', 'ac', 'generator', 'inverter'],
      'Cleaning': ['clean', 'laundry', 'wash', 'housekeep', 'housekeeping', 'maid', 'deep clean'],
      'Painting': ['paint', 'wall', 'texture', 'roller', 'coat', 'exterior', 'interior'],
      'Car Repairs': ['car', 'auto', 'mechanic', 'vehicle', 'engine', 'tire', 'brake', 'battery', 'garage'],
      'Hair Salon': ['hair', 'barber', 'salon', 'beauty', 'stylist', 'barbershop', 'hairstyle', 'cut'],
      'Tutoring': ['tutor', 'teach', 'lesson', 'coach', 'education', 'teacher', 'science', 'math'],
      'Catering': ['cater', 'food', 'chef', 'cook', 'event', 'party', 'restaurant'],
      'Photography': ['photo', 'camera', 'video', 'wedding', 'shoot', 'photographer', 'studio'],
      'Music': ['music', 'dj', 'band', 'singer', 'audio', 'sound', 'instrument'],
      'Fashion': ['fashion', 'clothing', 'design', 'tailor', 'sewing', 'boutique', 'dress'],
      'Tech': ['tech', 'computer', 'laptop', 'software', 'web', 'app', 'IT', 'developer'],
      'Fitness': ['gym', 'fitness', 'trainer', 'yoga', 'massage', 'health', 'workout'],
      'Real Estate': ['estate', 'property', 'house', 'land', 'apartment', 'rent'],
      'Security': ['security', 'guard', 'cctv', 'alarm', 'surveillance', 'safety'],
      'Hookah/Shisha': ['hookah', 'shisha', 'puff', 'smoke', 'sheesha'],
      'Barbing': ['barbing', 'barber', 'haircut', 'fade', 'clean up'],
      'CCTV': ['cctv', 'camera', 'security', 'surveillance', 'monitoring'],
      'Graphic Design': ['design', 'graphic', 'logo', 'brand', 'creative', 'artwork'],
    }
    
    let bestMatch = ''
    let bestScore = 0
    
    for (const [cat, kws] of Object.entries(keywords)) {
      let score = 0
      for (const k of kws) {
        if (content.includes(k)) {
          score++
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestMatch = cat
      }
    }
    
    return bestMatch || 'Service Provider'
  }

// loadData function - SIMPLE and FAST with Firebase as primary source
  const loadData = async () => {
    setLoadError(null)
    console.log('Admin: Loading data...')
    
    // Show loading
    setLoading(true)
    
    let totalProviders = 0
    let totalUsers = 0
    let totalWebsites = 0
    
    try {
      // 1. Load from Firebase FIRST (published websites are stored here)
      try {
        const fbWebsites = await realtimeDb.get('websites', true)
        if (fbWebsites) {
          const fbList = Object.values(fbWebsites) as any[]
          console.log('Admin: Found', fbList.length, 'websites from Firebase')
          
          const processedWebsites = fbList.map((w: any) => ({
            ...w,
            isPublished: w.isPublished !== false,
            isActive: w.isActive !== false,
            displayName: w.displayName || w.companyName || 'Untitled',
            ownerName: w.ownerName || 'Unknown'
          }))
          
          setWebsites(processedWebsites)
          storage.set('admin_websites', processedWebsites)
          totalWebsites = processedWebsites.length
          
          setStats(prev => ({
            ...prev,
            totalWebsites: processedWebsites.length,
            activeWebsites: processedWebsites.filter((w: any) => w.isPublished).length
          }))
        }
      } catch (e) {
        console.log('Admin: Firebase websites load failed')
      }

      // 2. Fetch users from API for accurate counts
      try {
        const usersRes = await axios.get(`${API_BASE}/users`, { timeout: 5000 })
        if (usersRes?.data?.users) {
          let apiUsers = Array.isArray(usersRes.data.users) 
            ? usersRes.data.users 
            : Object.values(usersRes.data.users)
          
          apiUsers = apiUsers.filter((u: any) => u.id !== 'admin_001')
          
          totalUsers = apiUsers.length
          totalProviders = apiUsers.filter((u: any) => u.userType === 'provider').length
          
          setUsers(apiUsers)
          storage.set('admin_users', apiUsers)
          console.log('Admin: Found', apiUsers.length, 'users from API')
          
          const providersList = apiUsers
            .filter((u: any) => u.userType === 'provider')
            .map((u: any) => ({
              id: u.id,
              businessName: u.businessName || u.displayName || u.fullName?.split(' ')[0] || 'Business',
              ownerName: u.fullName || 'Owner',
              email: u.email || '',
              category: u.category || 'Service',
              isVerified: u.isVerified || false,
              isActive: u.isActive !== false,
              createdAt: u.createdAt || new Date().toISOString()
            }))
          
          setProviders(providersList)
          storage.set('admin_providers', providersList)
          
          setStats(prev => ({
            ...prev,
            totalUsers: apiUsers.length,
            activeUsers: apiUsers.filter((u: any) => u.isActive && !u.isSuspended).length,
            totalProviders: providersList.length,
            verifiedProviders: providersList.filter(p => p.isVerified).length
          }))
        }
      } catch (e) {
        console.log('Admin: Users API failed')
      }

      // 3. Cache stats for next load
      const currentStats = storage.get('admin_stats') || {}
      storage.set('admin_stats', {
        ...currentStats,
        totalUsers,
        totalProviders,
        totalWebsites
      })

    } catch (error) {
      console.error('Admin: Error loading data:', error)
    }
    
    console.log('Admin: Loading complete')
    setLoading(false)
  }

  useEffect(() => {
    const currentAdmin = storage.getUser()
    if (!currentAdmin || currentAdmin.userType !== 'admin') {
      router.push('/auth/login')
      return
    }
    setAdmin(currentAdmin)
    
    // Load data immediately (cached data shows first)
    loadData()
  }, [router])

  // Real-time subscriptions for websites and activities
  useEffect(() => {
    // Try to load from localStorage first (instant)
    const cachedActivities = storage.get('admin_activities') || []
    if (cachedActivities.length > 0) {
      setActivities(cachedActivities)
    }
    
    // Then fetch from API
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${API_BASE}/activity?limit=50`, { timeout: 5000 })
        if (response.data?.logs && response.data.logs.length > 0) {
          const newActivities = response.data.logs.slice(0, 50)
          setActivities(newActivities)
          storage.set('admin_activities', newActivities)
        }
      } catch (e) {
        console.log('Activity fetch from API failed:', e)
        
        // Try Firebase as backup
        try {
          const fbActivity = await realtimeDb.get('activity', true)
          if (fbActivity) {
            const fbList = Object.values(fbActivity) as any[]
            if (fbList.length > 0) {
              const sorted = fbList.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50)
              setActivities(sorted)
              storage.set('admin_activities', sorted)
            }
          }
        } catch (fbError) {
          console.log('Firebase activity fetch also failed')
        }
      }
    }
    
    fetchActivities()
  }, [])

  const saveFeaturedSettings = async () => {
    setSavingFeatured(true)
    try {
      // Save to localStorage (this always works)
      storage.set('featured_providers_settings', featuredSettings)
      
      // Try Firebase sync (non-blocking)
      try {
        realtimeDb.set('settings/featured_providers', {
          ...featuredSettings,
          updatedAt: new Date().toISOString(),
          updatedBy: admin?.id || 'admin'
        })
      } catch (e) {
        console.log('Firebase sync skipped:', e)
      }
      
      // Try to track activity (non-blocking)
      try {
        if (typeof trackActivity === 'function') {
          trackActivity(admin?.id, 'updated_featured_providers', 'settings', `Selected ${featuredSettings.featuredIds.length} providers`)
        }
      } catch (e) {
        console.log('Activity tracking skipped')
      }
      
      toast.success(`Featured providers saved! ${featuredSettings.featuredIds.length} providers selected.`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save featured settings')
    } finally {
      setSavingFeatured(false)
    }
  }

  const toggleFeaturedProvider = (providerId: string) => {
    setFeaturedSettings(prev => {
      const isFeatured = prev.featuredIds.includes(providerId)
      return {
        ...prev,
        featuredIds: isFeatured
          ? prev.featuredIds.filter(id => id !== providerId)
          : [...prev.featuredIds, providerId]
      }
    })
  }

  const selectAllVerified = () => {
    const verifiedIds = providers.filter(p => p.isVerified).map(p => p.id)
    setFeaturedSettings(prev => ({
      ...prev,
      featuredIds: [...new Set([...prev.featuredIds, ...verifiedIds])]
    }))
  }

  const clearAllFeatured = () => {
    setFeaturedSettings(prev => ({
      ...prev,
      featuredIds: []
    }))
  }

  const handleSaveHomepage = async () => {
    setSavingHomepage(true)
    try {
      const success = await saveHomepageSnapshot()
      if (success) {
        toast.success('Homepage snapshot saved successfully!')
      } else {
        toast.error('Failed to save homepage snapshot')
      }
    } catch (error) {
      console.error('Save homepage error:', error)
      toast.error('Failed to save homepage snapshot')
    } finally {
      setSavingHomepage(false)
    }
  }

  const approveComment = async (commentId: string) => {
    try {
      await realtimeDb.update(`comments/${commentId}`, { approved: true })
      setComments(comments.map(c => c.id === commentId ? { ...c, approved: true } : c))
      toast.success('Comment approved and will show on homepage')
    } catch (error) {
      toast.error('Failed to approve comment')
    }
  }

  const unapproveComment = async (commentId: string) => {
    try {
      await realtimeDb.update(`comments/${commentId}`, { approved: false })
      setComments(comments.map(c => c.id === commentId ? { ...c, approved: false } : c))
      toast.success('Comment hidden from homepage')
    } catch (error) {
      toast.error('Failed to hide comment')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    try {
      await realtimeDb.remove(`comments/${commentId}`)
      setComments(comments.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const updateUserStatus = async (userId: string, updates: any) => {
    try {
      const response = await axios.put(`${API_BASE}/users/${userId}`, {
        ...updates,
        adminId: admin?.id
      })
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? response.data.user : u))
        toast.success('User updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const updateUserEmail = async (userId: string, newEmail: string) => {
    try {
      const response = await axios.post(`${API_BASE}/admin/update-email`, {
        userId,
        newEmail,
        adminKey: process.env.NEXT_PUBLIC_ADMIN_KEY || ''
      })
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, email: newEmail } : u))
        setSelectedItem({ ...selectedItem, email: newEmail })
        toast.success('Email updated successfully')
      }
    } catch (error) {
      toast.error('Failed to update email')
    }
  }

  const handleAction = async (action: string, type: string, item: any) => {
    // Track all admin actions for audit
    const actionDetails = `${action}: ${type}: ${item.id || item.name || 'unknown'}`
    trackAdminAction(admin, action, actionDetails)
    
    switch (action) {
      case 'toggle_status':
        if (type === 'user') {
          const updatedUsers = users.map(u => 
            u.id === item.id ? { ...u, isActive: !u.isActive } : u
          )
          setUsers(updatedUsers)
          storage.set('admin_users', updatedUsers)
          toast.success(`User ${item.isActive ? 'deactivated' : 'activated'}`)
          await trackActivity(admin?.id, 'user_status_changed', 'user', item.id)
        }
        break
        
      case 'suspend':
        if (type === 'user') {
          const updatedUsers = users.map(u => 
            u.id === item.id ? { ...u, isSuspended: true, isActive: false } : u
          )
          setUsers(updatedUsers)
          storage.set('admin_users', updatedUsers)
          toast.success('User suspended')
          await trackActivity(admin?.id, 'user_suspended', 'user', item.id)
        }
        break
        
      case 'verify':
        if (type === 'provider') {
          const updatedProviders = providers.map(p => 
            p.id === item.id ? { ...p, isVerified: true } : p
          )
          setProviders(updatedProviders)
          storage.set('admin_providers', updatedProviders)
          toast.success('Provider verified')
          await trackActivity(admin?.id, 'provider_verified', 'provider', item.id)
        }
        break
        
      case 'toggle_active':
        if (type === 'provider') {
          const updatedProviders = providers.map(p => 
            p.id === item.id ? { ...p, isActive: !p.isActive } : p
          )
          setProviders(updatedProviders)
          storage.set('admin_providers', updatedProviders)
          toast.success(`Provider ${item.isActive ? 'deactivated' : 'activated'}`)
          await trackActivity(admin?.id, 'provider_status_changed', 'provider', item.id)
        } else if (type === 'website') {
          const updatedWebsites = websites.map(w => 
            w.id === item.id ? { ...w, isActive: !w.isActive } : w
          )
          setWebsites(updatedWebsites)
          storage.setMiniWebsites(updatedWebsites)
          toast.success(`Website ${item.isActive ? 'disabled' : 'enabled'}`)
          await trackActivity(admin?.id, 'website_status_changed', 'website', item.id)
        }
        break
        
      case 'delete':
        if (type === 'user') {
          const updatedUsers = users.filter(u => u.id !== item.id)
          setUsers(updatedUsers)
          storage.set('admin_users', updatedUsers)
          toast.success('User deleted')
          await trackActivity(admin?.id, 'user_deleted', 'user', item.id)
        } else if (type === 'provider') {
          const updatedProviders = providers.filter(p => p.id !== item.id)
          setProviders(updatedProviders)
          storage.set('admin_providers', updatedProviders)
          toast.success('Provider deleted')
          await trackActivity(admin?.id, 'provider_deleted', 'provider', item.id)
        } else if (type === 'website') {
          const updatedWebsites = websites.filter(w => w.id !== item.id)
          setWebsites(updatedWebsites)
          storage.setMiniWebsites(updatedWebsites)
          toast.success('Website deleted')
          await trackActivity(admin?.id, 'website_deleted', 'website', item.id)
        }
        break
        
      case 'update_ticket':
        const updatedTickets = tickets.map(t => 
          t.id === item.id ? { ...t, status: item.status } : t
        )
        setTickets(updatedTickets)
        storage.set('admin_tickets', updatedTickets)
        toast.success(`Ticket marked as ${item.status}`)
        break
        
      case 'update_setting':
        const updatedSettings = settings.map(s => 
          s.id === item.id ? { ...s, value: item.value } : s
        )
        setSettings(updatedSettings)
        storage.set('admin_settings', updatedSettings)
        toast.success('Setting updated')
        break
    }
    setShowModal(false)
    setSelectedItem(null)
  }

  const handleLogout = () => {
    storage.clearUser()
    router.push('/')
  }

  const openModal = (type: string, item?: any) => {
    setModalType(type)
    setSelectedItem(item)
    setShowModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': case 'verified': case 'resolved': 
        return 'bg-green-100 text-green-800'
      case 'inactive': case 'pending': case 'processing': case 'in_progress': 
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended': case 'failed': case 'rejected': case 'open': 
        return 'bg-red-100 text-red-800'
      default: 
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredData = () => {
    const term = searchTerm.toLowerCase()
    switch (activeTab) {
      case 'users':
        return users.filter(u => 
          u.fullName.toLowerCase().includes(term) || 
          u.email.toLowerCase().includes(term)
        )
      case 'providers':
        return providers.filter(p => 
          p.businessName.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term)
        )
      case 'transactions':
        return transactions.filter(t => 
          t.userName.toLowerCase().includes(term) ||
          t.reference.toLowerCase().includes(term)
        )
      case 'tickets':
        return tickets.filter(t => 
          t.subject.toLowerCase().includes(term) ||
          t.userName.toLowerCase().includes(term)
        )
      case 'websites':
        // Filter websites by search term - show all matching websites
        return (websites as any[]).filter(w => 
          !term ||
          w.displayName?.toLowerCase().includes(term.toLowerCase()) ||
          w.companyName?.toLowerCase().includes(term.toLowerCase()) ||
          w.ownerName?.toLowerCase().includes(term.toLowerCase()) ||
          w.category?.toLowerCase().includes(term.toLowerCase())
        )
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <div>
              <div className="text-2xl font-bold text-blue-600">BIXFIND</div>
              <span className="text-xs text-gray-600">Admin Portal</span>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <a href="https://bixfind.indevs.in" className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold">
              <Globe className="w-4 h-4" />
              Home
            </a>
            <button 
              onClick={() => loadData()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
              {stats.pendingTickets > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.pendingTickets}
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">+{stats.newUsersToday} today</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Providers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProviders}</p>
                <p className="text-sm text-green-600 mt-1">{stats.verifiedProviders} verified</p>
              </div>
              <Building2 className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Commission Earned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">₦{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Platform commission
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Support Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTickets}</p>
                <p className="text-sm text-yellow-600 mt-1">open tickets</p>
              </div>
              <MessageSquare className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Websites</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalWebsites}</p>
                <p className="text-sm text-blue-600 mt-1">{stats.activeWebsites} published</p>
              </div>
              <Globe className="w-10 h-10 text-indigo-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{loadError}</p>
                <p className="text-sm text-red-600 mt-1">Check browser console (F12) for details</p>
              </div>
            </div>
            <button 
              onClick={() => loadData()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'providers', label: 'Providers', icon: Building2 },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'tickets', label: 'Support', icon: MessageSquare },
              { id: 'websites', label: 'Websites', icon: Globe },
              { id: 'comments', label: 'Reviews', icon: MessageSquare },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Platform Health
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">API Uptime</span>
                        <span className="font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> {stats.platformUptime}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Database Status</span>
                        <span className="font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Healthy
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Sessions</span>
                        <span className="font-bold">2,341</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Maintenance Mode</span>
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Disabled
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      This Month
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">New Users</span>
                        <span className="font-bold text-green-600">+{stats.newUsersToday}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">New Providers</span>
                        <span className="font-bold text-green-600">+{stats.newProvidersToday}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Earned</span>
                        <span className="font-bold text-green-600">₦{stats.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Support Tickets</span>
                        <span className="font-bold text-yellow-600">{stats.pendingTickets} open</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Recent Activity
                    <button 
                      onClick={() => loadData()}
                      className="ml-auto text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activities.length > 0 ? activities.slice(0, 10).map((activity, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1 text-sm">
                          <p>
                            <span className="font-medium capitalize">{activity.action?.replace(/_/g, ' ')}</span>
                            <span className="text-gray-500"> - {activity.entityType}</span>
                          </p>
                          {activity.userId && (
                            <p className="text-xs text-gray-400">User: {activity.userId}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No recent activity - Real-time updates active</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg w-64"
                    />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                      <tbody>
                      {filteredData().map(user => (
                        <tr key={user.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {user.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold">{user.fullName}</div>
                                <div className="text-xs text-gray-500">{user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{user.email}</td>
                          <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm capitalize">{user.userType}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-1">
                              {user.isVerified && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                  Verified
                                </span>
                              )}
                              {user.isSuspended ? (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                  Suspended
                                </span>
                              ) : user.isActive ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openModal('view_user', user)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction('toggle_status', 'user', user)}
                                className="p-2 hover:bg-yellow-100 text-yellow-600 rounded"
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {user.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              {!user.isSuspended && (
                                <button
                                  onClick={() => handleAction('suspend', 'user', user)}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded"
                                  title="Suspend"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleAction('delete', 'user', user)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Providers Tab */}
            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search providers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg w-64"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Owner</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData().map(provider => (
                        <tr key={provider.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{provider.businessName}</td>
                          <td className="px-4 py-3 text-sm">{provider.ownerName}</td>
                          <td className="px-4 py-3 text-sm">{provider.category}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              {provider.rating}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            ₦{provider.revenue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-1">
                              {provider.isVerified ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                  Pending
                                </span>
                              )}
                              {provider.isActive ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {!provider.isVerified && (
                                <button
                                  onClick={() => handleAction('verify', 'provider', provider)}
                                  className="p-2 hover:bg-green-100 text-green-600 rounded"
                                  title="Verify"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleAction('toggle_active', 'provider', provider)}
                                className="p-2 hover:bg-yellow-100 text-yellow-600 rounded"
                                title={provider.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {provider.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => openModal('view_provider', provider)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction('delete', 'provider', provider)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg w-64"
                    />
                    <select className="px-4 py-2 border rounded-lg">
                      <option>All Types</option>
                      <option>Payment</option>
                      <option>Withdrawal</option>
                      <option>Deposit</option>
                    </select>
                    <select className="px-4 py-2 border rounded-lg">
                      <option>All Status</option>
                      <option>Completed</option>
                      <option>Processing</option>
                      <option>Failed</option>
                    </select>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData().map(txn => (
                        <tr key={txn.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{txn.id}</td>
                          <td className="px-4 py-3 text-sm">{txn.userName}</td>
                          <td className="px-4 py-3 text-sm capitalize">{txn.type}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">
                            ₦{txn.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">{txn.description}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{txn.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Support Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg w-64"
                    />
                    <select className="px-4 py-2 border rounded-lg">
                      <option>All Status</option>
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                    <select className="px-4 py-2 border rounded-lg">
                      <option>All Priority</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredData().map(ticket => (
                    <div key={ticket.id} className="border rounded-lg p-6 hover:shadow transition">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {ticket.priority}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          <p className="text-xs text-gray-500">
                            From: {ticket.userName} • {ticket.createdAt}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {ticket.status === 'open' && (
                            <button
                              onClick={() => handleAction('update_ticket', 'ticket', { ...ticket, status: 'in_progress' })}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              Start Progress
                            </button>
                          )}
                          {ticket.status === 'in_progress' && (
                            <button
                              onClick={() => handleAction('update_ticket', 'ticket', { ...ticket, status: 'resolved' })}
                              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            >
                              Mark Resolved
                            </button>
                          )}
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Websites Tab */}
            {activeTab === 'websites' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Search websites..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 border rounded-lg w-64"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData().map(website => (
                    <div key={website.id} className="bg-white border rounded-lg overflow-hidden hover:shadow transition">
                      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                        {website.bannerUrl ? (
                          <img src={website.bannerUrl} alt={website.displayName} className="w-full h-full object-cover" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-bold text-white text-lg leading-tight">{website.heroTitle || website.displayName}</h3>
                          {website.tagline && (
                            <p className="text-white/80 text-xs mt-1 truncate">{website.tagline}</p>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1">
                          {website.isPublished ? (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded">Published</span>
                          ) : website.hasProfile ? (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Has Profile</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded">Draft</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 truncate">/{website.companyName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">By:</span> {website.ownerName || 'Unknown'}
                            </p>
                            {website.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                {website.category}
                              </span>
                            )}
                          </div>
                          {website.logoUrl && (
                            <img src={website.logoUrl} alt={website.displayName} className="w-12 h-12 rounded-lg object-cover ml-2" />
                          )}
                        </div>
                        {/* Show brief content preview */}
                        {website.aboutContent && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{website.aboutContent}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {website.views || 0}
                          </span>
                          {website.products?.length > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <Package className="w-4 h-4" /> {website.products.length} products
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/profile-site/${website.companyName}`}
                            target="_blank"
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Live
                          </a>
                          <button
                            onClick={() => handleAction('toggle_active', 'website', website)}
                            className={`px-3 py-2 rounded ${
                              website.isActive 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={website.isActive ? 'Disable' : 'Enable'}
                          >
                            {website.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleAction('delete', 'website', website)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredData().length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No websites found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Manage Reviews</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Review and approve user comments to display on the homepage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Load comments from Firebase */}
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className={`bg-white border rounded-lg p-4 ${comment.approved ? 'border-green-200' : 'border-yellow-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                              {comment.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{comment.name}</h4>
                              <p className="text-xs text-gray-500">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {comment.approved ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Approved
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-gray-600">{comment.text}</p>
                        <div className="mt-3 flex gap-2">
                          {comment.approved ? (
                            <button
                              onClick={() => unapproveComment(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
                            >
                              <EyeOff className="w-4 h-4" />
                              Hide
                            </button>
                          ) : (
                            <button
                              onClick={() => approveComment(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">Email Communications</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Send emails to users. Configure SMTP in Firebase Functions for actual email delivery.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Send Single Email */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-lg mb-4">Send Single Email</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                      <input
                        type="email"
                        id="singleEmailTo"
                        placeholder="user@example.com"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        id="singleEmailSubject"
                        placeholder="Email subject"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        id="singleEmailMessage"
                        rows={4}
                        placeholder="Enter your message..."
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        const to = (document.getElementById('singleEmailTo') as HTMLInputElement).value
                        const subject = (document.getElementById('singleEmailSubject') as HTMLInputElement).value
                        const message = (document.getElementById('singleEmailMessage') as HTMLTextAreaElement).value
                        
                        if (!to || !subject || !message) {
                          toast.error('Please fill in all fields')
                          return
                        }
                        
                        try {
                          const res = await axios.post(`${API_BASE}/send-email`, { to, subject, message })
                          toast.success(res.data.message)
                        } catch (e: any) {
                          toast.error(e.response?.data?.error || 'Failed to send email')
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Send Email
                    </button>
                  </div>
                </div>

                {/* Send Bulk Email */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-lg mb-4">Send Bulk Email</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        id="bulkEmailSubject"
                        placeholder="Email subject"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        id="bulkEmailMessage"
                        rows={4}
                        placeholder="Enter your message..."
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User Type</label>
                        <select id="bulkUserType" className="w-full px-4 py-2 border rounded-lg">
                          <option value="">All Users</option>
                          <option value="provider">Providers Only</option>
                          <option value="customer">Customers Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                        <select id="bulkVerified" className="w-full px-4 py-2 border rounded-lg">
                          <option value="">All</option>
                          <option value="true">Verified Only</option>
                          <option value="false">Unverified Only</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {users.length} users found matching criteria. 
                        If email is not configured, in-app notifications will be created instead.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const subject = (document.getElementById('bulkEmailSubject') as HTMLInputElement).value
                        const message = (document.getElementById('bulkEmailMessage') as HTMLTextAreaElement).value
                        const userType = (document.getElementById('bulkUserType') as HTMLSelectElement).value
                        const filterVerified = (document.getElementById('bulkVerified') as HTMLSelectElement).value
                        
                        if (!subject || !message) {
                          toast.error('Please fill in subject and message')
                          return
                        }
                        
                        try {
                          const res = await axios.post(`${API_BASE}/send-bulk-email`, { 
                            subject, 
                            message,
                            userType: userType || undefined,
                            filterVerified: filterVerified === '' ? undefined : filterVerified === 'true'
                          })
                          toast.success(res.data.message)
                        } catch (e: any) {
                          toast.error(e.response?.data?.error || 'Failed to send bulk email')
                        }
                      }}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                    >
                      Send to All Users
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-3xl">
                {/* Homepage Snapshot Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-900">Homepage Snapshot</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Save homepage data as a single JSON for instant loading. Recommended after adding new providers.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveHomepage}
                    disabled={savingHomepage}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {savingHomepage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Snapshot...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Homepage Snapshot
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Platform Settings</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        These settings control the overall platform behavior. Changes here affect all users.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment API Settings */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">💳</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">Wallet & Payment Settings</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Configure your payment gateway API to enable wallet transactions.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment API Provider</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="">Select Provider</option>
                        <option value="flutterwave">Flutterwave</option>
                        <option value="paystack">Paystack</option>
                        <option value="stripe">Stripe</option>
                        <option value="monify">Monify</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                      <input 
                        type="text" 
                        placeholder="Enter public key"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                      <input 
                        type="password" 
                        placeholder="Enter secret key"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL (for verification)</label>
                      <input 
                        type="text" 
                        value="https://api-eal2ibekhq-uc.a.run.app/webhook/payment"
                        readOnly
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="walletEnabled" className="w-4 h-4" />
                      <label htmlFor="walletEnabled" className="text-sm text-gray-700">Enable Wallet System</label>
                    </div>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold">
                      Save Payment Settings
                    </button>
                  </div>
                </div>

                {/* Featured Providers Settings */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">⭐</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-900">Featured Providers</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Control which providers appear on the homepage top providers section.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={featuredSettings.isActive}
                        onChange={(e) => setFeaturedSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 text-purple-600 rounded" 
                      />
                      <span className="text-sm font-medium text-purple-900">Active</span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Providers to Display</label>
                        <select 
                          value={featuredSettings.maxProviders}
                          onChange={(e) => setFeaturedSettings(prev => ({ ...prev, maxProviders: parseInt(e.target.value) }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="4">4 Providers</option>
                          <option value="6">6 Providers</option>
                          <option value="8">8 Providers</option>
                          <option value="12">12 Providers</option>
                          <option value="16">16 Providers</option>
                          <option value="20">20 Providers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                        <div className="flex gap-2">
                          <button
                            onClick={selectAllVerified}
                            className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                          >
                            Select All Verified
                          </button>
                          <button
                            onClick={clearAllFeatured}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Select Providers to Feature</label>
                        <span className="text-sm text-purple-600 font-medium">
                          {featuredSettings.featuredIds.length} selected
                        </span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Search providers..."
                          value={featuredSearchTerm}
                          onChange={(e) => setFeaturedSearchTerm(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select
                          value={featuredCategoryFilter}
                          onChange={(e) => setFeaturedCategoryFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                          <option value="all">All Categories</option>
                          {[...new Set(providers.map(p => p.category))].filter(Boolean).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                        {providers
                          .filter(p => {
                            const matchesSearch = p.businessName.toLowerCase().includes(featuredSearchTerm.toLowerCase()) ||
                              p.ownerName.toLowerCase().includes(featuredSearchTerm.toLowerCase())
                            const matchesCategory = featuredCategoryFilter === 'all' || p.category === featuredCategoryFilter
                            return matchesSearch && matchesCategory
                          })
                          .map((provider) => (
                            <label 
                              key={provider.id} 
                              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${
                                featuredSettings.featuredIds.includes(provider.id) 
                                  ? 'bg-purple-100 border border-purple-200' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                checked={featuredSettings.featuredIds.includes(provider.id)}
                                onChange={() => toggleFeaturedProvider(provider.id)}
                                className="w-4 h-4 text-purple-600 rounded" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{provider.businessName}</p>
                                <p className="text-xs text-gray-500">{provider.category || 'General'}</p>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                                provider.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {provider.isVerified ? '✓ Verified' : 'Pending'}
                              </span>
                              {provider.rating > 0 && (
                                <span className="text-xs text-yellow-500 flex-shrink-0">★ {provider.rating}</span>
                              )}
                            </label>
                          ))}
                        {providers.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No providers available</p>
                        )}
                        {providers.length > 0 && providers.filter(p => {
                          const matchesSearch = p.businessName.toLowerCase().includes(featuredSearchTerm.toLowerCase()) ||
                            p.ownerName.toLowerCase().includes(featuredSearchTerm.toLowerCase())
                          const matchesCategory = featuredCategoryFilter === 'all' || p.category === featuredCategoryFilter
                          return matchesSearch && matchesCategory
                        }).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No providers match your search</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-purple-100 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={featuredSettings.autoRotate}
                          onChange={(e) => setFeaturedSettings(prev => ({ ...prev, autoRotate: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 rounded" 
                        />
                        <span className="text-sm text-purple-900">Auto-rotate featured weekly</span>
                      </label>
                      <span className="text-xs text-purple-600">
                        ({featuredSettings.featuredIds.length} of {featuredSettings.maxProviders} slots filled)
                      </span>
                    </div>
                    <button 
                      onClick={saveFeaturedSettings}
                      disabled={savingFeatured}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {savingFeatured ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Save Featured Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {settings.map(setting => (
                  <div key={setting.id} className="bg-white border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{setting.key.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      {setting.isPublic && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Public</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <input
                        type="text"
                        value={setting.value}
                        onChange={(e) => {
                          const updated = settings.map(s => 
                            s.id === setting.id ? { ...s, value: e.target.value } : s
                          )
                          setSettings(updated)
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleAction('update_setting', 'setting', setting)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Danger Zone</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div>
                        <h5 className="font-semibold text-red-900">Maintenance Mode</h5>
                        <p className="text-sm text-red-700">Temporarily disable the platform for all users</p>
                      </div>
                      <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-100">
                        Enable
                      </button>
                    </div>
                    <div className="flex justify-between items-center p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div>
                        <h5 className="font-semibold text-red-900">Clear All Data</h5>
                        <p className="text-sm text-red-700">Permanently delete all user data (cannot be undone)</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Clear Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Real-time Activity Log</h3>
                  <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-white border rounded-lg hover:shadow">
                      <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.action}
                          <span className="text-gray-500 font-normal"> - {activity.entityType}</span>
                          {activity.entityId && (
                            <span className="text-gray-400 font-mono text-sm ml-2">({activity.entityId})</span>
                          )}
                        </p>
                        {activity.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">View Details</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {modalType === 'view_user' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                      {selectedItem.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">{selectedItem.fullName}</h4>
                      <p className="text-gray-600 text-sm">ID: {selectedItem.id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{selectedItem.email}</p>
                          <button
                            onClick={() => {
                              const newEmail = prompt('Enter new email address:', selectedItem.email)
                              if (newEmail && newEmail !== selectedItem.email) {
                                updateUserEmail(selectedItem.id, newEmail)
                              }
                            }}
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                            title="Edit Email"
                          >
                            <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedItem.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User Type</p>
                      <p className="font-medium capitalize">{selectedItem.userType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{selectedItem.isSuspended ? 'Suspended' : selectedItem.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Joined</p>
                      <p className="font-medium">{selectedItem.createdAt}</p>
                    </div>
                  </div>
                </div>
              )}
              {modalType === 'view_provider' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl font-bold">
                      {selectedItem.businessName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">{selectedItem.businessName}</h4>
                      <p className="text-gray-600">by {selectedItem.ownerName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{selectedItem.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="font-medium">{selectedItem.rating} / 5</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Services</p>
                      <p className="font-medium">{selectedItem.services}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="font-medium text-green-600">₦{selectedItem.revenue.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedItem.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
