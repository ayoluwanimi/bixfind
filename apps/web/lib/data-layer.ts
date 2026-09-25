// Unified Data Layer - Supabase with offline caching
// Primary: Supabase → Cache: localStorage

const cache = {
  get: <T>(key: string, maxAgeMs: number = 300000): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(`bixfind_cache_${key}`)
      if (!item) return null
      const { data, timestamp } = JSON.parse(item)
      if (Date.now() - timestamp > maxAgeMs) {
        localStorage.removeItem(`bixfind_cache_${key}`)
        return null
      }
      return data as T
    } catch {
      return null
    }
  },
  set: <T>(key: string, data: T) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`bixfind_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }))
    } catch (e) {
      console.error('Cache save failed:', e)
    }
  }
}

export interface Website {
  id: string
  userId: string
  companyName?: string
  displayName?: string
  heroTitle?: string
  category?: string
  services?: string[]
  phone?: string
  email?: string
  address?: string
  logoUrl?: string
  bannerUrl?: string
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  email: string
  name?: string
  fullName?: string
  phone?: string
  userType: 'user' | 'provider' | 'admin'
  role?: string
  isVerified?: boolean
  isActive?: boolean
  wallet?: { balance: number }
  createdAt?: string
}

// Fast parallel fetch from Supabase + cache
export const fetchAllData = async () => {
  const [supabaseData, cachedData] = await Promise.allSettled([
    fetchFromSupabase(),
    Promise.resolve(cache.get<{ websites: Website[], users: User[] }>('all_data'))
  ])

  const supabase = supabaseData.status === 'fulfilled' ? supabaseData.value : { websites: [], users: [] }
  const cached = cachedData.status === 'fulfilled' ? cachedData.value : null

  const websites = mergeWebsites(supabase.websites, cached?.websites || [])
  const users = mergeUsers(supabase.users, cached?.users || [])

  cache.set('all_data', { websites, users })

  return { websites, users }
}

// Supabase fetch
const fetchFromSupabase = async () => {
  try {
    const { supabase, isSupabaseConfigured } = await import('./supabase')
    if (!isSupabaseConfigured() || !supabase) {
      return { websites: [] as Website[], users: [] as User[] }
    }

    const [{ data: websites }, { data: users }] = await Promise.all([
      supabase.from('websites').select('*'),
      supabase.from('users').select('*')
    ])

    return {
      websites: (websites || []).map(normalizeWebsite),
      users: (users || []).map(normalizeUser)
    }
  } catch (e) {
    console.error('Supabase fetch failed:', e)
    return { websites: [] as Website[], users: [] as User[] }
  }
}

// Merge websites: dedupe by ID, prefer Supabase
const mergeWebsites = (supabase: Website[], cached: Website[]): Website[] => {
  const map = new Map<string, Website>()
  
  cached.forEach(w => map.set(w.id, w))
  supabase.forEach(w => map.set(w.id, w))

  return Array.from(map.values()).filter(w => w.companyName || w.displayName)
}

// Merge users: dedupe by ID, prefer Supabase
const mergeUsers = (supabase: User[], cached: User[]): User[] => {
  const map = new Map<string, User>()
  
  cached.forEach(u => map.set(u.id, u))
  supabase.forEach(u => map.set(u.id, u))

  return Array.from(map.values())
}

// Normalize website from Supabase (snake_case to camelCase)
const normalizeWebsite = (w: any): Website => ({
  id: w.id,
  userId: w.user_id || w.userId || '',
  companyName: w.company_name || w.companyName,
  displayName: w.display_name || w.displayName,
  heroTitle: w.hero_title || w.heroTitle,
  category: w.category,
  services: w.services,
  phone: w.phone,
  email: w.email,
  address: w.address,
  logoUrl: w.logo_url || w.logoUrl,
  bannerUrl: w.banner_url || w.bannerUrl,
  isPublished: w.is_published ?? w.isPublished ?? true,
  createdAt: w.created_at || w.createdAt,
  updatedAt: w.updated_at || w.updatedAt
})

// Normalize user from Supabase
const normalizeUser = (u: any): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  fullName: u.full_name || u.fullName,
  phone: u.phone,
  userType: u.role || u.user_type || u.userType || 'user',
  role: u.role || u.userType,
  isVerified: u.is_verified ?? u.isVerified ?? false,
  isActive: u.is_active ?? u.isActive ?? true,
  wallet: u.wallet || { balance: 0 },
  createdAt: u.created_at || u.createdAt
})

// Fast login check: checks Supabase first, then cache
export const loginCheck = async (email: string, password: string): Promise<User | null> => {
  // 1. Check Supabase
  try {
    const { loginWithEmail } = await import('./supabase')
    const result = await loginWithEmail(email, password)
    if (result.data) {
      const user = normalizeUser(result.data)
      cache.set(`user_${user.id}`, user)
      return user
    }
  } catch (e) {}

  // 2. Check cache
  const cachedUsers = cache.get<Record<string, User>>('users_cache')
  if (cachedUsers) {
    for (const user of Object.values(cachedUsers)) {
      if (user.email?.toLowerCase() === email.toLowerCase()) {
        return user
      }
    }
  }

  return null
}

// Get published websites fast
export const getPublishedWebsites = async (): Promise<Website[]> => {
  const cached = cache.get<Website[]>('published_websites', 60000)
  if (cached?.length) return cached

  const { websites } = await fetchAllData()
  const published = websites.filter(w => w.isPublished !== false)
  cache.set('published_websites', published)
  return published
}

// Get user count fast
export const getUserCounts = async (): Promise<{ total: number; providers: number; users: number }> => {
  const cached = cache.get<{ total: number; providers: number; users: number }>('user_counts', 60000)
  if (cached) return cached

  const { users } = await fetchAllData()
  const providers = users.filter(u => u.userType === 'provider' || u.role === 'provider').length
  const regularUsers = users.filter(u => u.userType === 'user' || u.role === 'user').length
  
  const counts = { total: users.length, providers, users: regularUsers }
  cache.set('user_counts', counts)
  return counts
}

export { cache }
export default { fetchAllData, loginCheck, getPublishedWebsites, getUserCounts, cache }
