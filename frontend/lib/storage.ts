// Frontend-only localStorage for demo/Netlify environment
// Enhanced with error handling and storage quota management

const CACHE_PREFIX = 'bixfind_'

// Check if storage is available and has space
const checkStorage = (): { available: boolean; used: number; limit: number } => {
  if (typeof window === 'undefined') {
    return { available: false, used: 0, limit: 0 }
  }
  
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    
    // Estimate usage
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    
    return { available: true, used: total, limit: 5 * 1024 * 1024 } // ~5MB typical limit
  } catch (e) {
    return { available: false, used: 0, limit: 0 }
  }
}

// Compress image to reduce storage usage
export const compressImage = (dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// Get storage status
export const getStorageStatus = () => {
  return checkStorage()
}

// Clear old/unused data to free space
export const clearOldCache = () => {
  if (typeof window === 'undefined') return
  
  try {
    // Clear old cached data
    const keysToRemove = []
    for (let key in localStorage) {
      if (key.includes('_cache_') || key.includes('_temp_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (e) {
    console.log('Error clearing old cache:', e)
  }
}

export const storage = {
  // User authentication
  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}user`, JSON.stringify(user));
      } catch (e) {
        // If quota exceeded, try to clear old data
        clearOldCache()
        try {
          localStorage.setItem(`${CACHE_PREFIX}user`, JSON.stringify(user));
        } catch (e2) {
          console.error('Storage full - could not save user')
        }
      }
    }
  },
  
  getUser: () => {
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem(`${CACHE_PREFIX}user`);
        return user ? JSON.parse(user) : null;
      } catch (e) {
        console.error('Error reading user:', e)
        return null
      }
    }
    return null;
  },
  
  clearUser: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${CACHE_PREFIX}user`);
      } catch (e) {}
    }
  },

  // Auth token
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}token`, token);
      } catch (e) {
        console.error('Storage full - could not save token')
      }
    }
  },
  
  getToken: () => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(`${CACHE_PREFIX}token`);
      } catch (e) {
        return null
      }
    }
    return null;
  },
  
  clearToken: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${CACHE_PREFIX}token`);
      } catch (e) {}
    }
  },
  
  // Wallet data
  setWallet: (wallet: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}wallet`, JSON.stringify(wallet));
      } catch (e) {}
    }
  },

  getWallet: () => {
    if (typeof window !== 'undefined') {
      try {
        const wallet = localStorage.getItem(`${CACHE_PREFIX}wallet`);
        return wallet ? JSON.parse(wallet) : { balance: 0, transactions: [] };
      } catch (e) {
        return { balance: 0, transactions: [] }
      }
    }
    return { balance: 0, transactions: [] };
  },

  // Services
  setServices: (services: any[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}services`, JSON.stringify(services));
      } catch (e) {}
    }
  },

  getServices: () => {
    if (typeof window !== 'undefined') {
      try {
        const services = localStorage.getItem(`${CACHE_PREFIX}services`);
        return services ? JSON.parse(services) : [];
      } catch (e) {
        return []
      }
    }
    return [];
  },

  // Mini Websites
  setMiniWebsites: (websites: any[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}websites`, JSON.stringify(websites));
      } catch (e) {
        clearOldCache()
        try {
          localStorage.setItem(`${CACHE_PREFIX}websites`, JSON.stringify(websites));
        } catch (e2) {
          console.error('Storage full - could not save websites')
        }
      }
    }
  },

  getMiniWebsites: () => {
    if (typeof window !== 'undefined') {
      try {
        const websites = localStorage.getItem(`${CACHE_PREFIX}websites`);
        return websites ? JSON.parse(websites) : [];
      } catch (e) {
        return []
      }
    }
    return [];
  },

  setCurrentWebsite: (website: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}current_website`, JSON.stringify(website));
      } catch (e) {
        console.error('Storage full - could not save current website')
      }
    }
  },

  getCurrentWebsite: () => {
    if (typeof window !== 'undefined') {
      try {
        const website = localStorage.getItem(`${CACHE_PREFIX}current_website`);
        return website ? JSON.parse(website) : null;
      } catch (e) {
        return null
      }
    }
    return null;
  },

  // Website Templates
  setWebsiteTemplates: (templates: any[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}templates`, JSON.stringify(templates));
      } catch (e) {}
    }
  },

  getWebsiteTemplates: () => {
    if (typeof window !== 'undefined') {
      try {
        const templates = localStorage.getItem(`${CACHE_PREFIX}templates`);
        return templates ? JSON.parse(templates) : [];
      } catch (e) {
        return []
      }
    }
    return [];
  },

  // Admin data cache
  setAdminStats: (stats: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${CACHE_PREFIX}admin_stats`, JSON.stringify(stats));
      } catch (e) {}
    }
  },

  getAdminStats: () => {
    if (typeof window !== 'undefined') {
      try {
        const stats = localStorage.getItem(`${CACHE_PREFIX}admin_stats`);
        return stats ? JSON.parse(stats) : null;
      } catch (e) {
        return null
      }
    }
    return null;
  },

  // Generic storage with error handling
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return
    
    const storageKey = `${CACHE_PREFIX}${key}`
    
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(storageKey, serialized)
    } catch (e: any) {
      // Handle quota exceeded
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_FILE_CORRUPTED') {
        console.warn('Storage quota exceeded, attempting cleanup...')
        clearOldCache()
        
        try {
          const serialized = JSON.stringify(value)
          localStorage.setItem(storageKey, serialized)
        } catch (e2) {
          console.error('Still cannot save after cleanup:', e2)
        }
      }
    }
  },

  get: (key: string) => {
    if (typeof window === 'undefined') return null
    
    try {
      const value = localStorage.getItem(`${CACHE_PREFIX}${key}`)
      return value ? JSON.parse(value) : null
    } catch (e) {
      console.error('Error reading from storage:', e)
      return null
    }
  },
  
  // Remove specific key
  remove: (key: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      } catch (e) {}
    }
  },
  
  // Clear all BixFind data
  clearAll: () => {
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = []
        for (let key in localStorage) {
          if (key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (e) {}
    }
  }
};
