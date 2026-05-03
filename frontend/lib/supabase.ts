import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient | null = null
let supabaseInitialized = false

if (typeof window !== 'undefined') {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    supabaseInitialized = true
    console.log('Supabase initialized successfully')
  } else {
    console.warn('Supabase not configured - set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

export { supabase, supabaseInitialized }

export const isSupabaseConfigured = () => supabaseInitialized

const sbCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 10000

const loadCache = (key: string): any => {
  const cached = sbCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

const saveCache = (key: string, data: any) => {
  sbCache.set(key, { data, timestamp: Date.now() })
}

export const sb = {
  from: (table: string) => {
    if (!supabase) {
      return {
        select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }), then: () => Promise.resolve({ data: [] }) }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }) })
      }
    }
    return supabase.from(table)
  },

  set: async (table: string, data: any): Promise<boolean> => {
    if (!supabase) return false
    try {
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
      return !error
    } catch (e) {
      console.error('Supabase set error:', e)
      return false
    }
  },

  get: async (table: string, query?: { eq?: string; eqValue?: string }): Promise<any[]> => {
    if (!supabase) return []
    try {
      let queryBuilder = supabase.from(table).select('*')
      if (query?.eq && query?.eqValue) {
        const { data } = await queryBuilder.eq(query.eq, query.eqValue)
        return data || []
      }
      const { data } = await queryBuilder
      return data || []
    } catch (e) {
      console.error('Supabase get error:', e)
      return []
    }
  }
}

export const realtimeDb = {
  set: async (path: string, data: any): Promise<boolean> => {
    const [table, id] = path.split('/')
    if (!table || !id) return false
    
    const cached = loadCache(path)
    saveCache(path, data)
    
    if (!supabase) return false
    try {
      const { error } = await supabase.from(table).upsert({ id, ...data }, { onConflict: 'id' })
      return !error
    } catch (e) {
      console.error('Supabase set error:', e)
      return false
    }
  },

  get: async (path: string, skipCache: boolean = false): Promise<any> => {
    const cached = loadCache(path)
    if (!skipCache && cached) return cached
    
    const [table, id] = path.split('/')
    if (!table) return null
    
    if (!supabase) return cached || null
    try {
      let query = supabase.from(table).select('*')
      
      if (id && id !== table) {
        const { data } = await query.eq('id', id).single()
        if (data) saveCache(path, data)
        return data
      } else {
        const { data } = await query
        if (data) saveCache(path, data)
        return data
      }
    } catch (e) {
      console.error('Supabase get error:', e)
      return cached || null
    }
  },

  update: async (path: string, data: any): Promise<boolean> => {
    const [table, id] = path.split('/')
    if (!table || !id) return false
    
    if (!supabase) return false
    try {
      const { error } = await supabase.from(table).update(data).eq('id', id)
      return !error
    } catch (e) {
      console.error('Supabase update error:', e)
      return false
    }
  },

  push: async (path: string, data: any): Promise<string | null> => {
    const [table, ...parts] = path.split('/')
    if (!table) return null
    
    const id = parts.join('/') || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (!supabase) return id
    try {
      const { error } = await supabase.from(table).insert({ id, ...data })
      return error ? null : id
    } catch (e) {
      console.error('Supabase push error:', e)
      return null
    }
  },

  remove: async (path: string): Promise<boolean> => {
    const [table, id] = path.split('/')
    if (!table || !id) return false
    
    if (!supabase) return false
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      return !error
    } catch (e) {
      console.error('Supabase remove error:', e)
      return false
    }
  },

  clearCache: (path?: string) => {
    if (path) {
      sbCache.delete(path)
    } else {
      sbCache.clear()
    }
  },

  getOfflineQueueStatus: () => ({
    pendingOperations: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    supabaseInitialized
  }),

  subscribe: (path: string, callback: (data: any) => void) => {
    if (!supabase) return () => {}
    const [table] = path.split('/')
    
    try {
      const channel = supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          callback(payload.new || payload.old)
        })
        .subscribe()
      return () => supabase.removeChannel(channel)
    } catch (e) {
      console.error('Supabase subscribe error:', e)
      return () => {}
    }
  },

  subscribeToUser: (userId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`users/${userId}`, callback)
  },

  subscribeToWebsite: (websiteId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`websites/${websiteId}`, callback)
  },

  subscribeToNotifications: (userId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`notifications/${userId}`, callback)
  },

  subscribeToActivity: (callback: (data: any) => void) => {
    return realtimeDb.subscribe(`activity`, callback)
  },

  subscribeToPublishedWebsites: (callback: (data: any) => void) => {
    if (!supabase) return () => {}
    try {
      const channel = supabase.channel('published-websites')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'websites',
          filter: 'isPublished=eq.true'
        }, (payload) => {
          callback(payload.new || payload.old)
        })
        .subscribe()
      return () => supabase.removeChannel(channel)
    } catch (e) {
      console.error('Supabase subscribe error:', e)
      return () => {}
    }
  }
}

export const storage = {
  uploadLogo: async (userId: string, file: File): Promise<string | null> => {
    if (!supabase) return null
    try {
      const fileName = `logos/${userId}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      return publicUrl
    } catch (error) {
      console.error('Logo upload error:', error)
      return null
    }
  },

  uploadWebsiteImage: async (websiteId: string, file: File): Promise<string | null> => {
    if (!supabase) return null
    try {
      const fileName = `websites/${websiteId}/images/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      return publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      return null
    }
  },

  uploadBanner: async (websiteId: string, file: File): Promise<string | null> => {
    if (!supabase) return null
    try {
      const fileName = `websites/${websiteId}/banner/${file.name}`
      const { data, error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      return publicUrl
    } catch (error) {
      console.error('Banner upload error:', error)
      return null
    }
  },

  uploadAvatar: async (userId: string, file: File): Promise<string | null> => {
    if (!supabase) return null
    try {
      const fileName = `avatars/${userId}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage.from('images').upload(fileName, file)
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName)
      return publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      return null
    }
  }
}

export const trackActivity = async (userId: string | null, action: string, entityType: string, entityId?: string, details?: any) => {
  await realtimeDb.push('activity', { userId, action, entityType, entityId, details, timestamp: Date.now() })
}

export const loginWithEmail = async (email: string, password: string) => {
  if (!supabase) {
    return { error: { message: 'Supabase not configured' } }
  }
  try {
    const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single()
    if (error || !data) {
      return { error: { message: 'Invalid credentials' } }
    }
    return { data, error: null, session: { access_token: 'supabase_token' } }
  } catch (e) {
    return { error: { message: 'Login failed' } }
  }
}

export const sendNotification = async (userId: string, notification: {
  title: string
  message: string
  type: string
  link?: string
}) => {
  await realtimeDb.push(`notifications/${userId}`, { ...notification, read: false, timestamp: Date.now() })
}

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  if (!address || !mapsApiKey) return null
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${mapsApiKey}`
    )
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return { lat: location.lat, lng: location.lng }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return null
}

export const geocodeAddresses = async (addresses: { id: string; address: string }[]): Promise<{ id: string; lat: number; lng: number }[]> => {
  const results: { id: string; lat: number; lng: number }[] = []
  
  for (const item of addresses) {
    const coords = await geocodeAddress(item.address)
    if (coords) {
      results.push({ id: item.id, ...coords })
    }
  }
  
  return results
}

export interface HomepageSnapshot {
  totalProviders: number
  totalServices: number
  totalProducts: number
  topProviders: { userId: string; name: string; serviceName: string; logo?: string }[]
  lastUpdated: number
}

export const saveHomepageSnapshot = async (): Promise<boolean> => {
  try {
    const { data: websites } = await (supabase?.from('websites').select('*').eq('isPublished', true))
    
    const { data: users } = await (supabase?.from('users').select('*'))
    
    const websiteList = websites || []
    const userList = users || []
    
    const totalProviders = websiteList.length
    
    let totalProducts = 0
    for (const site of websiteList) {
      if (site.products) {
        totalProducts += Array.isArray(site.products) ? site.products.length : Object.keys(site.products).length
      }
    }
    
    const topProviders = websiteList.slice(0, 10).map((site: any) => ({
      userId: site.userId,
      name: site.companyName || 'Provider',
      serviceName: site.companyName || 'Service',
      logo: site.logoUrl
    }))
    
    const snapshot: HomepageSnapshot = {
      totalProviders,
      totalServices: totalProviders,
      totalProducts,
      topProviders,
      lastUpdated: Date.now()
    }
    
    await realtimeDb.set('homepage', snapshot)
    
    console.log('Homepage snapshot saved:', snapshot)
    return true
  } catch (e) {
    console.error('Save homepage snapshot error:', e)
    return false
  }
}

export const getHomepageSnapshot = async (): Promise<HomepageSnapshot | null> => {
  return await realtimeDb.get('homepage') as HomepageSnapshot | null
}