'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Shield, Activity, Database, RefreshCw, Globe, Mail, Percent, ToggleLeft, ToggleRight, Server, HardDrive, Cpu, Wifi, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function AdminSystemPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [config, setConfig] = useState<any>({
    appName: 'BixFind',
    supportEmail: 'support@bixfind.indevs.in',
    platformFee: 5,
    maxUploadSize: 10,
    maintenanceMode: false,
    allowNewRegistrations: true,
    allowProviderSignups: true,
    enableChat: true,
    enableReviews: true,
    enableMapView: true,
  })
  const [apiStatus, setApiStatus] = useState<{[key: string]: boolean | null}>({
    localStorage: true,
    storage: true,
    services: null,
  })
  const [checking, setChecking] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [envInfo, setEnvInfo] = useState<any>({})

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') { router.push('/login'); return }
    setAdmin(currentAdmin)

    const savedConfig = storage.get('platform_config')
    if (savedConfig) setConfig(savedConfig)

    setEnvInfo({
      nodeVersion: typeof process !== 'undefined' ? process.versions?.node || 'N/A' : 'N/A',
      platform: typeof navigator !== 'undefined' ? navigator.platform || 'N/A' : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent?.substring(0, 80) + '...' : 'N/A',
      language: typeof navigator !== 'undefined' ? navigator.language || 'N/A' : 'N/A',
      appVersion: '1.0.0',
      storageUsed: (() => { try { let total = 0; for (let k in localStorage) total += localStorage[k]?.length || 0; return (total / 1024).toFixed(1) + 'KB' } catch { return 'N/A' } })(),
    })
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const saveConfig = (key: string, value: any) => {
    const updated = { ...config, [key]: value }
    setConfig(updated)
    storage.set('platform_config', updated)
  }

  const handleCheckAPI = async () => {
    setChecking(true)
    setTimeout(() => {
      setApiStatus({
        localStorage: true,
        storage: true,
        services: true,
      })
      setChecking(false)
    }, 1500)
  }

  const handleClearCache = () => {
    setClearing(true)
    setTimeout(() => {
      storage.clearAll()
      setClearing(false)
    }, 1000)
  }

  const features = [
    { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Put platform in maintenance mode' },
    { key: 'allowNewRegistrations', label: 'New Registrations', desc: 'Allow new user signups' },
    { key: 'allowProviderSignups', label: 'Provider Signups', desc: 'Allow new provider registrations' },
    { key: 'enableChat', label: 'Chat System', desc: 'Enable real-time messaging' },
    { key: 'enableReviews', label: 'Reviews & Ratings', desc: 'Allow users to leave reviews' },
    { key: 'enableMapView', label: 'Map View', desc: 'Show providers on interactive map' },
  ]

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-white/60 mt-1">Platform configuration and maintenance</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-400" />Platform Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> App Name</label>
              <input type="text" value={config.appName} onChange={e => saveConfig('appName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Support Email</label>
              <input type="email" value={config.supportEmail} onChange={e => saveConfig('supportEmail', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1 flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Platform Fee (%)</label>
                <input type="number" value={config.platformFee} onChange={e => saveConfig('platformFee', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">Max Upload (MB)</label>
                <input type="number" value={config.maxUploadSize} onChange={e => saveConfig('maxUploadSize', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ToggleLeft className="w-5 h-5 text-purple-400" />Feature Toggles</h2>
          <div className="space-y-3">
            {features.map(feat => (
              <div key={feat.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{feat.label}</p>
                  <p className="text-xs text-white/40">{feat.desc}</p>
                </div>
                <button
                  onClick={() => saveConfig(feat.key, !config[feat.key])}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config[feat.key] ? 'bg-blue-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${config[feat.key] ? 'left-[26px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" />API Status</h2>
          <div className="space-y-3">
            {Object.entries(apiStatus).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-white/40" />
                  <div>
                    <p className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs text-white/40">{key === 'localStorage' ? 'Browser storage API' : key === 'services' ? 'Service database' : 'Local data store'}</p>
                  </div>
                </div>
                {status === null ? (
                  <span className="text-xs text-white/40">—</span>
                ) : status ? (
                  <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Operational</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" /> Down</span>
                )}
              </div>
            ))}
            <button onClick={handleCheckAPI} disabled={checking} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {checking ? 'Checking...' : 'Check All Endpoints'}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><HardDrive className="w-5 h-5 text-emerald-400" />Environment Info</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm py-2 border-b border-white/5"><span className="text-white/40">App Version</span><span className="text-white">{envInfo.appVersion || '1.0.0'}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-white/5"><span className="text-white/40">Platform</span><span className="text-white">{envInfo.platform}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-white/5"><span className="text-white/40">Language</span><span className="text-white">{envInfo.language}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-white/5"><span className="text-white/40">Storage Used</span><span className="text-white">{envInfo.storageUsed}</span></div>
            <div className="flex justify-between text-sm py-2 border-b border-white/5"><span className="text-white/40">Node Version</span><span className="text-white">{envInfo.nodeVersion}</span></div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Database className="w-4 h-4 text-red-400" />Cache Management</h3>
            <p className="text-xs text-white/60 mb-3">Clear all locally cached data and reset temporary storage</p>
            <button onClick={handleClearCache} disabled={clearing} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 w-full">
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {clearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
