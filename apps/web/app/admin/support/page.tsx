'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Send, User, Tag, ArrowUpRight, Search } from 'lucide-react'
import { storage } from '@/lib/storage'

type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

interface SupportReply {
  id: string
  body: string
  authorEmail: string
  authorName: string
  isAdmin: boolean
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  message: string
  userName: string
  userEmail: string
  userPhone?: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  category?: string
  replies: SupportReply[]
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/support/tickets')
      const json = await res.json()
      if (json.success) setTickets(json.tickets)
    } catch {
      console.error('Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const currentAdmin = storage.getUser()
    if (!currentAdmin || (currentAdmin.user_metadata?.user_type || currentAdmin.userType) !== 'admin') { router.push('/login'); return }
    setAdmin(currentAdmin)
    fetchTickets()
  }, [router, fetchTickets])

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: replyText.trim(),
          replyAuthorEmail: admin?.email || 'admin@bixfind.indevs.in',
          replyAuthorName: admin?.user_metadata?.full_name || admin?.fullName || 'Support Team',
          isAdmin: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSelectedTicket(json.ticket)
        setTickets(prev => prev.map(t => t.id === json.ticket.id ? json.ticket : t))
        setReplyText('')
      }
    } catch {
      console.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.success) {
        setTickets(prev => prev.map(t => t.id === json.ticket.id ? json.ticket : t))
        if (selectedTicket?.id === id) setSelectedTicket(json.ticket)
      }
    } catch {
      console.error('Failed to update status')
    }
  }

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress')
  const resolvedToday = tickets.filter(t => t.status === 'resolved' && new Date(t.updatedAt).toDateString() === new Date().toDateString())

  const stats = [
    { icon: MessageSquare, label: 'Open Tickets', value: openTickets.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Clock, label: 'Total Tickets', value: tickets.length.toString(), color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: CheckCircle2, label: 'Resolved Today', value: resolvedToday.length.toString(), color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: AlertCircle, label: 'Needs Attention', value: tickets.filter(t => t.status === 'open').length.toString(), color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return t.subject?.toLowerCase().includes(term) || t.userName?.toLowerCase().includes(term) || t.userEmail?.toLowerCase().includes(term)
    }
    return true
  })

  const statusFilters = ['all', 'open', 'in-progress', 'resolved', 'closed']

  const getPriorityColor = (p: TicketPriority) => {
    if (p === 'urgent') return 'text-red-400 bg-red-500/20'
    if (p === 'high') return 'text-orange-400 bg-orange-500/20'
    if (p === 'medium') return 'text-yellow-400 bg-yellow-500/20'
    return 'text-green-400 bg-green-500/20'
  }

  const getStatusColor = (s: TicketStatus) => {
    if (s === 'open') return 'text-blue-400 bg-blue-500/20'
    if (s === 'in-progress') return 'text-yellow-400 bg-yellow-500/20'
    if (s === 'resolved') return 'text-green-400 bg-green-500/20'
    return 'text-white/40 bg-white/10'
  }

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-white/60 mt-1">Handle support requests from users</p>
        </div>
        <button onClick={fetchTickets} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">Refresh</button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-white/40" />
              </div>
              <div className="flex gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto">
                {statusFilters.map(sf => (
                  <button key={sf} onClick={() => setFilter(sf as any)} className={`px-3 py-1.5 rounded-md text-xs transition-all capitalize ${filter === sf ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>
                    {sf === 'all' ? 'All' : sf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center"><p className="text-white/40">Loading tickets...</p></div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No tickets found</p>
                <p className="text-white/40 text-sm mt-1">All caught up!</p>
              </div>
            ) : filteredTickets.map((ticket, i) => (
              <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 cursor-pointer transition-colors hover:bg-white/5 ${selectedTicket?.id === ticket.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                      {ticket.replies.length > 0 && <span className="text-[10px] text-white/30">{ticket.replies.length} replies</span>}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/40 flex items-center gap-1"><User className="w-3 h-3" />{ticket.userName}</span>
                      <span className="text-xs text-white/40"><Clock className="w-3 h-3 inline mr-1" />{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/20 shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          {selectedTicket ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Ticket Details</h3>
                <div className="flex gap-1">
                  {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                    <button onClick={() => handleStatusChange(selectedTicket.id, 'resolved')} className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors" title="Mark Resolved">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-white/40">Subject</p>
                  <p className="text-sm text-white font-medium">{selectedTicket.subject}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</span>
                </div>
                <div>
                  <p className="text-xs text-white/40">From</p>
                  <p className="text-sm text-white flex items-center gap-1"><User className="w-3.5 h-3.5 text-white/40" />{selectedTicket.userName}</p>
                  <p className="text-xs text-white/40">{selectedTicket.userEmail}</p>
                  {selectedTicket.userPhone && <p className="text-xs text-white/40">Phone: {selectedTicket.userPhone}</p>}
                </div>
                {selectedTicket.category && (
                  <div>
                    <p className="text-xs text-white/40">Category</p>
                    <p className="text-sm text-white flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-white/40" />{selectedTicket.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/40">Message</p>
                  <p className="text-sm text-white/70 mt-1 bg-white/5 rounded-lg p-3">{selectedTicket.message}</p>
                </div>

                {selectedTicket.replies.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Replies</p>
                    <div className="space-y-2">
                      {selectedTicket.replies.map(reply => (
                        <div key={reply.id} className={`p-2 rounded-lg text-xs ${reply.isAdmin ? 'bg-blue-500/10 ml-4' : 'bg-white/5 mr-4'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/60 font-medium">{reply.authorName}</span>
                            <span className="text-white/30">{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-white/70">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-white/40 mb-2">Reply</p>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <button onClick={handleSendReply} disabled={!replyText.trim() || sending} className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Reply</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">Select a ticket to view details</p>
              <p className="text-white/40 text-xs mt-1">Click on any ticket from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
