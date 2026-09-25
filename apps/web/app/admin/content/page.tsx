'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, AlertTriangle, CheckCircle2, XCircle, Flag, Trash2, Eye, Clock, Star, MessageSquare, Shield, RefreshCw, Loader2 } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function AdminContentPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [websites, setWebsites] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedItem, setSelectedItem] = useState<any>(null)

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

    const savedServices = storage.getServices() || []
    const platformComments = storage.get('platform_comments') || []
    const miniWebsites = storage.getMiniWebsites() || []

    setServices(savedServices)
    setComments(platformComments)
    setWebsites(miniWebsites)
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const pendingServices = services.filter((s: any) => s.status === 'pending' || !s.status)
  const flaggedItems = [
    ...comments.filter((c: any) => c.flagged || c.reported),
    ...websites.filter((w: any) => w.flagged || w.reported),
  ]
  const publishedServices = services.filter((s: any) => s.status === 'approved' || s.status === 'published')
  const reportedComments = comments.filter((c: any) => c.flagged || c.reported)
  const approvedComments = comments.filter((c: any) => c.approved)

  const statsRow = [
    { icon: Clock, label: 'Pending Reviews', value: (pendingServices.length + comments.filter(c => !c.approved && !c.flagged).length).toString(), color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: AlertTriangle, label: 'Flagged Content', value: flaggedItems.length.toString(), color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: CheckCircle2, label: 'Published Services', value: publishedServices.length.toString(), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: MessageSquare, label: 'Comments', value: comments.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  const handleApproveService = (id: string) => {
    const updated = services.map((s: any) => s.id === id ? { ...s, status: 'approved' } : s)
    storage.setServices(updated)
    setServices(updated)
  }

  const handleRejectService = (id: string) => {
    const updated = services.map((s: any) => s.id === id ? { ...s, status: 'rejected' } : s)
    storage.setServices(updated)
    setServices(updated)
  }

  const handleApproveComment = (id: string) => {
    const updated = comments.map((c: any) => c.id === id ? { ...c, approved: true } : c)
    storage.set('platform_comments', updated)
    setComments(updated)
  }

  const handleFlagItem = (id: string) => {
    const updated = comments.map((c: any) => c.id === id ? { ...c, flagged: true } : c)
    storage.set('platform_comments', updated)
    setComments(updated)
  }

  const handleRemoveComment = (id: string) => {
    const updated = comments.filter((c: any) => c.id !== id)
    storage.set('platform_comments', updated)
    setComments(updated)
  }

  const tabs = [
    { id: 'pending', label: 'Pending Services', count: pendingServices.length },
    { id: 'flagged', label: 'Flagged Content', count: flaggedItems.length },
    { id: 'comments', label: 'Review Comments', count: comments.filter(c => !c.approved).length },
  ]

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-white/60 mt-1">Review and manage platform content</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {statsRow.map((stat, i) => (
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
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>
                {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {pendingServices.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-400/30 mx-auto mb-4" />
                  <p className="text-white/60">No pending services to review</p>
                  <p className="text-white/40 text-sm mt-1">All services have been reviewed</p>
                </div>
              ) : pendingServices.map((service: any, i: number) => (
                <motion.div key={service.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white">
                        {(service.name || service.title || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{service.name || service.title || 'Untitled Service'}</p>
                        <p className="text-xs text-white/40 mt-0.5">{service.category || service.type || 'General'} • {service.providerName || service.providerId || 'Unknown Provider'}</p>
                        <p className="text-xs text-white/40 mt-1">{service.description ? service.description.substring(0, 100) + (service.description.length > 100 ? '...' : '') : 'No description'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {service.price && <span className="text-xs font-semibold text-emerald-400">₦{(service.price || 0).toLocaleString()}</span>}
                          <span className="text-xs text-white/40"><Clock className="w-3 h-3 inline mr-1" />{service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApproveService(service.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleRejectService(service.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'flagged' && (
            <div className="space-y-3">
              {flaggedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
                  <p className="text-white/60">No flagged content</p>
                  <p className="text-white/40 text-sm mt-1">All content is clean</p>
                </div>
              ) : flaggedItems.map((item: any, i: number) => (
                <motion.div key={item.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name || item.title || item.text || 'Flagged Item'}</p>
                        <p className="text-xs text-red-400 mt-0.5">Flagged Content</p>
                        {item.text && <p className="text-xs text-white/60 mt-1">"{item.text.substring(0, 200)}"</p>}
                        <p className="text-xs text-white/40 mt-1">
                          {item.companyName || item.displayName || item.name || 'Unknown'} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleRemoveComment(item.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3">
              {comments.filter(c => !c.approved).length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
                  <p className="text-white/60">No comments to review</p>
                  <p className="text-white/40 text-sm mt-1">All comments have been moderated</p>
                </div>
              ) : comments.filter(c => !c.approved).map((comment: any, i: number) => (
                <motion.div key={comment.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
                        {(comment.name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{comment.name || 'Anonymous'}</p>
                        <p className="text-xs text-white/70 mt-1">{comment.text || comment.content || 'No content'}</p>
                        <p className="text-xs text-white/40 mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApproveComment(comment.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleFlagItem(comment.id)} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-colors">
                        <Flag className="w-4 h-4" /> Flag
                      </button>
                      <button onClick={() => handleRemoveComment(comment.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
