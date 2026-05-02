import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, update, remove, onValue, Database, DatabaseReference, off } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bixfind-3055a.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://bixfind-3055a-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bixfind-3055a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bixfind-3055a.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

let app: FirebaseApp;
let database: Database;
let storage: FirebaseStorage;
let firebaseInitialized = false;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    database = getDatabase(app);
    storage = getStorage(app);
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } catch (e) {
    console.error('Firebase initialization error:', e);
    firebaseInitialized = false;
  }
}

export { app, database, storage };
export { firebaseInitialized };

// Offline queue for operations that need to sync when online
interface QueuedOperation {
  id: string;
  path: string;
  data: any;
  operation: 'set' | 'push' | 'update' | 'remove';
  timestamp: number;
  retries: number;
}

const offlineQueue: QueuedOperation[] = [];
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Load offline queue from localStorage
const loadOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('firebase_offline_queue');
    if (saved) {
      const parsed = JSON.parse(saved);
      offlineQueue.push(...parsed);
      console.log('Loaded offline queue with', parsed.length, 'operations');
    }
  } catch (e) {
    console.error('Error loading offline queue:', e);
  }
};

// Save offline queue to localStorage
const saveOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('firebase_offline_queue', JSON.stringify(offlineQueue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
};

// Process offline queue
const processOfflineQueue = async () => {
  if (!navigator.onLine || !firebaseInitialized) return;
  
  const toProcess = [...offlineQueue];
  for (const op of toProcess) {
    try {
      const dbRef = ref(database, op.path);
      if (op.operation === 'set') {
        await set(dbRef, op.data);
      } else if (op.operation === 'update') {
        await update(dbRef, op.data);
      } else if (op.operation === 'remove') {
        await remove(dbRef);
      }
      
      // Remove from queue on success
      const idx = offlineQueue.findIndex(o => o.id === op.id);
      if (idx !== -1) offlineQueue.splice(idx, 1);
      console.log('Synced offline operation:', op.path);
    } catch (e) {
      op.retries++;
      if (op.retries >= MAX_RETRIES) {
        // Remove after max retries
        const idx = offlineQueue.findIndex(o => o.id === op.id);
        if (idx !== -1) offlineQueue.splice(idx, 1);
        console.error('Failed to sync operation after', MAX_RETRIES, 'retries:', op.path);
      }
    }
  }
  saveOfflineQueue();
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network online - processing offline queue');
    processOfflineQueue();
  });
  
  // Load queue on init
  loadOfflineQueue();
  if (navigator.onLine) {
    processOfflineQueue();
  }
  
  // Periodically retry offline queue
  setInterval(() => {
    if (navigator.onLine && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, 30000); // Every 30 seconds
}

// Simple in-memory cache for Firebase reads
const fbCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

export const realtimeDb = {
  ref: (path: string) => {
    if (typeof window === 'undefined' || !firebaseInitialized) return null;
    try {
      return ref(database, path);
    } catch (e) {
      console.error('Firebase ref error:', e);
      return null;
    }
  },
  
  set: async (path: string, data: any): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase not initialized, queuing for later:', path);
        offlineQueue.push({
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          data,
          operation: 'set',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
        return false;
      }
      
      const dbRef = ref(database, path);
      await set(dbRef, data);
      return true;
    } catch (e) {
      console.error('Firebase set error:', e);
      
      // Queue for retry on network error
      if (!navigator.onLine) {
        offlineQueue.push({
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          data,
          operation: 'set',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
      }
      return false;
    }
  },
  
  get: async (path: string, skipCache: boolean = false): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = fbCache.get(path);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
    
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized');
      return null;
    }
    
    try {
      const dbRef = ref(database, path);
      const snapshot = await get(dbRef);
      const data = snapshot.val();
      
      // Cache the result
      if (data !== null) {
        fbCache.set(path, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (e) {
      console.error('Firebase get error:', e);
      return null;
    }
  },
  
  update: async (path: string, data: any): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase not initialized, queuing for later:', path);
        offlineQueue.push({
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          data,
          operation: 'update',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
        return false;
      }
      
      const dbRef = ref(database, path);
      await update(dbRef, data);
      return true;
    } catch (e) {
      console.error('Firebase update error:', e);
      
      if (!navigator.onLine) {
        offlineQueue.push({
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          data,
          operation: 'update',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
      }
      return false;
    }
  },
  
  push: async (path: string, data: any): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase not initialized, queuing for later:', path);
        const tempId = `queued_${Date.now()}`;
        offlineQueue.push({
          id: tempId,
          path: `${path}/${tempId}`,
          data,
          operation: 'push',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
        return tempId;
      }
      
      const dbRef = ref(database, path);
      const newRef = push(dbRef);
      await set(newRef, data);
      return newRef.key;
    } catch (e) {
      console.error('Firebase push error:', e);
      
      if (!navigator.onLine) {
        const tempId = `queued_${Date.now()}`;
        offlineQueue.push({
          id: tempId,
          path: `${path}/${tempId}`,
          data,
          operation: 'push',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
        return tempId;
      }
      return null;
    }
  },
  
  remove: async (path: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      if (!firebaseInitialized) {
        offlineQueue.push({
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          path,
          data: null,
          operation: 'remove',
          timestamp: Date.now(),
          retries: 0
        });
        saveOfflineQueue();
        return false;
      }
      
      const dbRef = ref(database, path);
      await remove(dbRef);
      return true;
    } catch (e) {
      console.error('Firebase remove error:', e);
      return false;
    }
  },
  
  // Clear cache for a specific path or all
  clearCache: (path?: string) => {
    if (path) {
      fbCache.delete(path);
    } else {
      fbCache.clear();
    }
  },
  
  // Get offline queue status
  getOfflineQueueStatus: () => ({
    pendingOperations: offlineQueue.length,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    firebaseInitialized
  }),
  
  subscribe: (path: string, callback: (data: any) => void) => {
    if (typeof window === 'undefined' || !firebaseInitialized) {
      console.log('Firebase not available, skipping subscription to:', path);
      return () => {};
    }
    try {
      const dbRef = ref(database, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        callback(snapshot.val());
      });
      return () => off(dbRef);
    } catch (e) {
      console.error('Firebase subscribe error:', e);
      return () => {};
    }
  },
  
  subscribeToUser: (userId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`users/${userId}`, callback);
  },
  
  subscribeToWebsite: (websiteId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`websites/${websiteId}`, callback);
  },
  
  subscribeToNotifications: (userId: string, callback: (data: any) => void) => {
    return realtimeDb.subscribe(`notifications/${userId}`, callback);
  },
  
  subscribeToActivity: (callback: (data: any) => void) => {
    return realtimeDb.subscribe(`activity`, callback);
  },
};

export const fileStorage = {
  uploadLogo: async (userId: string, file: File): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase Storage not available');
        return null;
      }
      const fileRef = storageRef(storage, `logos/${userId}/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('Logo upload error:', error);
      return null;
    }
  },
  
  uploadWebsiteImage: async (websiteId: string, file: File): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase Storage not available');
        return null;
      }
      const fileRef = storageRef(storage, `websites/${websiteId}/images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  },
  
  uploadBanner: async (websiteId: string, file: File): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase Storage not available');
        return null;
      }
      const fileRef = storageRef(storage, `websites/${websiteId}/banner/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('Banner upload error:', error);
      return null;
    }
  },
  
  uploadAvatar: async (userId: string, file: File): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      if (!firebaseInitialized) {
        console.warn('Firebase Storage not available');
        return null;
      }
      const fileRef = storageRef(storage, `avatars/${userId}/${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  },
};

export const trackActivity = async (userId: string | null, action: string, entityType: string, entityId?: string, details?: any) => {
  const activity = {
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: Date.now()
  };
  await realtimeDb.push('activity', activity);
};

export const sendNotification = async (userId: string, notification: {
  title: string;
  message: string;
  type: string;
  link?: string;
}) => {
  await realtimeDb.push(`notifications/${userId}`, {
    ...notification,
    read: false,
    timestamp: Date.now()
  });
};

export const updateUserPresence = async (userId: string, status: 'online' | 'offline') => {
  await realtimeDb.set(`presence/${userId}`, {
    status,
    lastSeen: Date.now()
  });
};

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address || !MAPS_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
};

export const geocodeAddresses = async (addresses: { id: string; address: string }[]): Promise<{ id: string; lat: number; lng: number }[]> => {
  const results: { id: string; lat: number; lng: number }[] = [];
  
  for (const item of addresses) {
    const coords = await geocodeAddress(item.address);
    if (coords) {
      results.push({ id: item.id, ...coords });
    }
  }
  
  return results;
};

// User Authentication Functions
export interface UserRecord {
  email: string;
  password: string; // Hashed
  name: string;
  userId: string;
  role: 'user' | 'provider' | 'admin';
  createdAt: number;
}

export const createUser = async (email: string, password: string, name: string, role: 'user' | 'provider' | 'admin' = 'user'): Promise<{ success: boolean; userId?: string; error?: string }> => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if user already exists
    const existingCreds = await get(ref(database, `userCredentials/${normalizedEmail.replace(/\./g, '_')}`));
    if (existingCreds.exists()) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password (simple hash for demo - use proper hashing in production)
    const hashedPassword = btoa(password + 'bixfind_salt_2024');
    
    // Save credentials lookup
    await set(ref(database, `userCredentials/${normalizedEmail.replace(/\./g, '_')}`), {
      userId,
      hashedPassword,
      createdAt: Date.now()
    });

    // Save user profile
    await set(ref(database, `users/${userId}`), {
      email: normalizedEmail,
      name,
      role,
      createdAt: Date.now()
    });

    fbCache.clear();
    return { success: true, userId };
  } catch (e) {
    console.error('Create user error:', e);
    return { success: false, error: String(e) };
  }
};

export const authenticateUser = async (email: string, password: string): Promise<{ success: boolean; userId?: string; role?: string; name?: string; error?: string }> => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const emailKey = normalizedEmail.replace(/\./g, '_');
    
    // Check credentials
    const credsSnapshot = await get(ref(database, `userCredentials/${emailKey}`));
    if (!credsSnapshot.exists()) {
      // Check for admin hardcoded credentials
      if (email === 'ayoluwanimi@gmail.com' && password === 'Community@1997') {
        return { success: true, userId: 'admin_001', role: 'admin', name: 'Admin' };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    const creds = credsSnapshot.val();
    const hashedPassword = btoa(password + 'bixfind_salt_2024');
    
    if (creds.hashedPassword !== hashedPassword) {
      // Check for admin hardcoded credentials
      if (email === 'ayoluwanimi@gmail.com' && password === 'Community@1997') {
        return { success: true, userId: 'admin_001', role: 'admin', name: 'Admin' };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    // Get user profile
    const userSnapshot = await get(ref(database, `users/${creds.userId}`));
    if (!userSnapshot.exists()) {
      return { success: false, error: 'User profile not found' };
    }

    const user = userSnapshot.val();
    return { 
      success: true, 
      userId: creds.userId, 
      role: user.role, 
      name: user.name 
    };
  } catch (e) {
    console.error('Auth error:', e);
    // Check for admin hardcoded credentials
    if (email === 'ayoluwanimi@gmail.com' && password === 'Community@1997') {
      return { success: true, userId: 'admin_001', role: 'admin', name: 'Admin' };
    }
    return { success: false, error: String(e) };
  }
};

export const getUserProfile = async (userId: string): Promise<UserRecord | null> => {
  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    return snapshot.val();
  } catch (e) {
    console.error('Get user profile error:', e);
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserRecord>): Promise<boolean> => {
  try {
    await update(ref(database, `users/${userId}`), data);
    fbCache.delete(`users/${userId}`);
    return true;
  } catch (e) {
    console.error('Update user profile error:', e);
    return false;
  }
};

// Homepage Snapshot Functions
export interface HomepageSnapshot {
  totalProviders: number;
  totalServices: number;
  totalProducts: number;
  topProviders: { userId: string; name: string; serviceName: string; logo?: string }[];
  lastUpdated: number;
}

export const saveHomepageSnapshot = async (): Promise<boolean> => {
  try {
    // Get all websites
    const websitesSnapshot = await get(ref(database, 'websites'));
    const websites = websitesSnapshot.val() || {};
    
    // Count stats
    let totalProviders = 0;
    let totalProducts = 0;
    const topProviders: HomepageSnapshot['topProviders'] = [];
    
    // Get users for provider info
    const usersSnapshot = await get(ref(database, 'users'));
    const users = usersSnapshot.val() || {};
    
    for (const [siteId, site] of Object.entries(websites)) {
      const website = site as any;
      if (website.isPublished) {
        totalProviders++;
        const productCount = website.products ? Object.keys(website.products).length : 0;
        totalProducts += productCount;
        
        const providerInfo = users[website.userId] || {};
        topProviders.push({
          userId: website.userId,
          name: providerInfo.name || website.companyName || 'Provider',
          serviceName: website.companyName || 'Service',
          logo: website.logo
        });
      }
    }
    
    // Sort top providers by name and limit to 10
    topProviders.sort((a, b) => a.name.localeCompare(b.name));
    const top10 = topProviders.slice(0, 10);
    
    const snapshot: HomepageSnapshot = {
      totalProviders,
      totalServices: totalProviders,
      totalProducts,
      topProviders: top10,
      lastUpdated: Date.now()
    };
    
    // Save to Firebase
    await set(ref(database, 'homepage'), snapshot);
    fbCache.delete('homepage');
    
    console.log('Homepage snapshot saved:', snapshot);
    return true;
  } catch (e) {
    console.error('Save homepage snapshot error:', e);
    return false;
  }
};

export const getHomepageSnapshot = async (): Promise<HomepageSnapshot | null> => {
  try {
    const snapshot = await get(ref(database, 'homepage'));
    return snapshot.val();
  } catch (e) {
    console.error('Get homepage snapshot error:', e);
    return null;
  }
};
