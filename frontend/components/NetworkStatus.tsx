'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react'
import { realtimeDb } from '@/lib/realtime'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOps, setPendingOps] = useState(0)
  const [showBanner, setShowBanner] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      setSyncing(true)
      
      // Check for pending operations
      const status = realtimeDb.getOfflineQueueStatus()
      setPendingOps(status.pendingOperations)
      
      // Auto-hide after 3 seconds if online and no pending ops
      setTimeout(() => {
        setSyncing(false)
        setShowBanner(false)
      }, 3000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check pending operations periodically
    const checkPending = () => {
      const status = realtimeDb.getOfflineQueueStatus()
      setPendingOps(status.pendingOperations)
      if (status.pendingOperations > 0 && status.isOnline) {
        setSyncing(true)
      }
    }
    
    const interval = setInterval(checkPending, 10000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!showBanner) return null

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">You&apos;re offline</p>
            <p className="text-sm text-red-100">Changes will be saved locally and synced when you&apos;re back online.</p>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Online but syncing */}
      {isOnline && syncing && pendingOps > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="font-semibold">Syncing...</p>
            <p className="text-sm text-blue-100">Syncing {pendingOps} pending changes</p>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-blue-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Back Online */}
      {isOnline && !syncing && showBanner && pendingOps === 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <Wifi className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Back online!</p>
            <p className="text-sm text-green-100">All changes have been saved.</p>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-green-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

// Hook for components to check online status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOps, setPendingOps] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const checkPending = () => {
      const status = realtimeDb.getOfflineQueueStatus()
      setPendingOps(status.pendingOperations)
    }
    
    const interval = setInterval(checkPending, 5000)
    checkPending()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, pendingOps }
}
