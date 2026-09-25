'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, XCircle, AlertTriangle, Eye, Search, Filter, ChevronDown, X, User, CreditCard, Building2, FileCheck, ExternalLink } from 'lucide-react'

interface KYCUser {
  id: string
  email: string
  name: string
  phone: string
  role: string
  kyc_status: string
  kyc_full_name: string
  kyc_dob: string
  kyc_phone: string
  kyc_address: string
  kyc_city: string
  kyc_state: string
  kyc_country: string
  kyc_id_type: string
  kyc_id_number: string
  kyc_id_document: string
  kyc_selfie: string
  kyc_nin_number: string
  kyc_nin_verified: boolean
  kyc_other_id_type: string
  kyc_other_id_number: string
  kyc_other_id_document: string
  kyc_business_name: string
  kyc_reg_number: string
  kyc_business_address: string
  kyc_tax_id: string
  kyc_utility_bill: string
  kyc_rejection_reason: string
  kyc_verified_at: string
  kyc_submitted_at: string
}

const STATUS_COLORS: Record<string, string> = {
  not_submitted: 'bg-gray-500/20 text-gray-400',
  pending: 'bg-amber-500/20 text-amber-400',
  verified: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID (NIN)',
  nin: 'NIN',
  passport: 'International Passport',
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
  other: 'Other',
}

export default function AdminKYCPage() {
  const [users, setUsers] = useState<KYCUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null)
  const [verifyModal, setVerifyModal] = useState<KYCUser | null>(null)
  const [rejectModal, setRejectModal] = useState<KYCUser | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [ninInput, setNinInput] = useState('')
  const [ninValidation, setNinValidation] = useState<{ valid: boolean; reason?: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 })

  const fetchKYC = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/kyc', { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
        const all = data.data || []
        setStats({
          total: all.length,
          pending: all.filter((u: KYCUser) => u.kyc_status === 'pending').length,
          verified: all.filter((u: KYCUser) => u.kyc_status === 'verified').length,
          rejected: all.filter((u: KYCUser) => u.kyc_status === 'rejected').length,
        })
      }
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { fetchKYC() }, [fetchKYC])

  const validateNIN = (nin: string) => {
    const cleaned = nin.replace(/[\s-]/g, '')
    if (!/^\d{11}$/.test(cleaned)) {
      setNinValidation({ valid: false, reason: 'NIN must be exactly 11 digits' })
      return
    }
    const weightedSum = cleaned.split('').reduce((sum, digit, i) => {
      return sum + parseInt(digit, 10) * (11 - i)
    }, 0)
    const remainder = weightedSum % 11
    const checkDigit = remainder < 2 ? 0 : 11 - remainder
    if (parseInt(cleaned[10], 10) !== checkDigit) {
      setNinValidation({ valid: false, reason: 'NIN checksum failed — invalid number' })
      return
    }
    setNinValidation({ valid: true })
  }

  const handleVerify = async (user: KYCUser) => {
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'verify',
          kyc_nin_number: ninInput || user.kyc_nin_number,
          kyc_id_type: user.kyc_id_type,
          kyc_id_number: user.kyc_id_number,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, kyc_status: 'verified', kyc_nin_verified: data.nin_verified } : u))
        setVerifyModal(null)
        setNinInput('')
        setNinValidation(null)
        fetchKYC()
      } else {
        alert(data.error || 'Verification failed')
      }
    } catch { alert('Failed to verify') }
    setProcessing(false)
  }

  const handleReject = async (user: KYCUser) => {
    if (!rejectReason.trim()) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, action: 'reject', rejection_reason: rejectReason }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, kyc_status: 'rejected', kyc_rejection_reason: rejectReason } : u))
        setRejectModal(null)
        setRejectReason('')
        fetchKYC()
      }
    } catch { }
    setProcessing(false)
  }

  const filteredUsers = users.filter(u => {
    if (filter !== 'all' && u.kyc_status !== filter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.kyc_full_name?.toLowerCase().includes(q) || u.kyc_nin_number?.includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6" /> KYC Verification</h1>
          <p className="text-white/50 mt-1">Review and verify user identity documents</p>
        </div>
        <button onClick={fetchKYC} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition text-sm">Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: stats.total, color: 'text-white' },
          { label: 'Pending Review', value: stats.pending, color: 'text-amber-400' },
          { label: 'Verified', value: stats.verified, color: 'text-green-400' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/50 text-sm">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, email, NIN..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm" />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'verified', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-sm font-medium transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
          <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60">No KYC submissions found</h3>
          <p className="text-white/40 text-sm mt-1">Users will appear here after submitting their KYC</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">{(user.name || 'U').charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-white font-medium">{user.kyc_full_name || user.name || 'Unknown'}</p>
                    <p className="text-white/40 text-xs">{user.email} • {user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.kyc_status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {user.kyc_status === 'not_submitted' ? 'Not Submitted' : user.kyc_status.charAt(0).toUpperCase() + user.kyc_status.slice(1)}
                  </span>
                  {user.kyc_nin_verified && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">NIN Verified</span>}
                  <button onClick={() => setSelectedUser(user)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition">
                    <Eye className="w-4 h-4" />
                  </button>
                  {user.kyc_status === 'pending' && (
                    <>
                      <button onClick={() => { setVerifyModal(user); setNinInput(user.kyc_nin_number || ''); validateNIN(user.kyc_nin_number || '') }} className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setRejectModal(user); setRejectReason('') }} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {(user.kyc_id_type || user.kyc_nin_number) && (
                <div className="mt-3 flex items-center gap-4 text-xs text-white/40 flex-wrap">
                  {user.kyc_id_type && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {ID_TYPE_LABELS[user.kyc_id_type] || user.kyc_id_type}: {user.kyc_id_number}</span>}
                  {user.kyc_nin_number && <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" /> NIN: {user.kyc_nin_number}</span>}
                  {user.kyc_submitted_at && <span>Submitted: {new Date(user.kyc_submitted_at).toLocaleDateString()}</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">KYC Details</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6">
                <Section title="Personal Information" icon={<User className="w-4 h-4" />}>
                  <Field label="Full Name" value={selectedUser.kyc_full_name} />
                  <Field label="Date of Birth" value={selectedUser.kyc_dob} />
                  <Field label="Phone" value={selectedUser.kyc_phone || selectedUser.phone} />
                  <Field label="Address" value={`${selectedUser.kyc_address || ''} ${selectedUser.kyc_city || ''} ${selectedUser.kyc_state || ''}`.trim()} />
                  <Field label="Country" value={selectedUser.kyc_country} />
                </Section>

                <Section title="Primary ID Verification" icon={<CreditCard className="w-4 h-4" />}>
                  <Field label="ID Type" value={ID_TYPE_LABELS[selectedUser.kyc_id_type] || selectedUser.kyc_id_type} />
                  <Field label="ID Number" value={selectedUser.kyc_id_number} />
                  {selectedUser.kyc_id_document && (
                    <div>
                      <p className="text-white/50 text-xs mb-2">ID Document</p>
                      <a href={selectedUser.kyc_id_document} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                        <ExternalLink className="w-3 h-3" /> View Document
                      </a>
                      {selectedUser.kyc_id_document.startsWith('data:') && (
                        <img src={selectedUser.kyc_id_document} alt="ID Document" className="mt-2 max-w-full max-h-64 rounded-lg border border-white/10 object-contain" />
                      )}
                    </div>
                  )}
                </Section>

                <Section title="NIN Verification" icon={<FileCheck className="w-4 h-4" />}>
                  <Field label="NIN Number" value={selectedUser.kyc_nin_number || 'Not provided'} />
                  <Field label="NIN Status" value={selectedUser.kyc_nin_verified ? '✅ Verified' : selectedUser.kyc_nin_number ? '⚠️ Not yet verified' : 'N/A'} />
                </Section>

                {(selectedUser.kyc_other_id_type || selectedUser.kyc_other_id_number) && (
                  <Section title="Additional ID" icon={<FileCheck className="w-4 h-4" />}>
                    <Field label="Type" value={ID_TYPE_LABELS[selectedUser.kyc_other_id_type] || selectedUser.kyc_other_id_type} />
                    <Field label="Number" value={selectedUser.kyc_other_id_number} />
                    {selectedUser.kyc_other_id_document && (
                      <div>
                        <p className="text-white/50 text-xs mb-2">Document</p>
                        {selectedUser.kyc_other_id_document.startsWith('data:') ? (
                          <img src={selectedUser.kyc_other_id_document} alt="Additional ID" className="mt-1 max-w-full max-h-48 rounded-lg border border-white/10 object-contain" />
                        ) : (
                          <a href={selectedUser.kyc_other_id_document} target="_blank" rel="noopener" className="text-blue-400 text-sm">View Document</a>
                        )}
                      </div>
                    )}
                  </Section>
                )}

                <Section title="Selfie" icon={<User className="w-4 h-4" />}>
                  {selectedUser.kyc_selfie ? (
                    selectedUser.kyc_selfie.startsWith('data:') ? (
                      <img src={selectedUser.kyc_selfie} alt="Selfie" className="max-w-xs max-h-48 rounded-lg border border-white/10 object-contain" />
                    ) : (
                      <a href={selectedUser.kyc_selfie} target="_blank" rel="noopener" className="text-blue-400 text-sm">View Selfie</a>
                    )
                  ) : <p className="text-white/40 text-sm">Not provided</p>}
                </Section>

                <Section title="Business Information" icon={<Building2 className="w-4 h-4" />}>
                  <Field label="Business Name" value={selectedUser.kyc_business_name || 'Not provided'} />
                  <Field label="Reg Number" value={selectedUser.kyc_reg_number || 'Not provided'} />
                  <Field label="Business Address" value={selectedUser.kyc_business_address || 'Not provided'} />
                  <Field label="Tax ID" value={selectedUser.kyc_tax_id || 'Not provided'} />
                  {selectedUser.kyc_utility_bill && (
                    <div>
                      <p className="text-white/50 text-xs mb-2">Utility Bill</p>
                      {selectedUser.kyc_utility_bill.startsWith('data:') ? (
                        <img src={selectedUser.kyc_utility_bill} alt="Utility Bill" className="max-w-full max-h-48 rounded-lg border border-white/10 object-contain" />
                      ) : (
                        <a href={selectedUser.kyc_utility_bill} target="_blank" rel="noopener" className="text-blue-400 text-sm">View Utility Bill</a>
                      )}
                    </div>
                  )}
                </Section>

                {selectedUser.kyc_rejection_reason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 font-medium text-sm mb-1">Rejection Reason</p>
                    <p className="text-white/70 text-sm">{selectedUser.kyc_rejection_reason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Submitted: {selectedUser.kyc_submitted_at ? new Date(selectedUser.kyc_submitted_at).toLocaleString() : 'N/A'}</span>
                  <span>Verified: {selectedUser.kyc_verified_at ? new Date(selectedUser.kyc_verified_at).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setVerifyModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Verify KYC</h2>
              <p className="text-white/60 text-sm mb-4">Verify KYC for <strong className="text-white">{verifyModal.kyc_full_name || verifyModal.name}</strong></p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">NIN Number (for verification)</label>
                  <input value={ninInput} onChange={e => { setNinInput(e.target.value); validateNIN(e.target.value) }} placeholder="Enter 11-digit NIN" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm" />
                  {ninValidation && (
                    <p className={`text-xs mt-1 ${ninValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                      {ninValidation.valid ? '✅ NIN checksum valid' : `❌ ${ninValidation.reason}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setVerifyModal(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 text-sm">Cancel</button>
                  <button onClick={() => handleVerify(verifyModal)} disabled={processing || (ninInput && !ninValidation?.valid)} className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {processing ? 'Verifying...' : 'Verify & Approve'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRejectModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-400" /> Reject KYC</h2>
              <p className="text-white/60 text-sm mb-4">Reject KYC for <strong className="text-white">{rejectModal.kyc_full_name || rejectModal.name}</strong></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Rejection Reason (required)</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why the KYC is being rejected..." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm resize-none" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 text-sm">Cancel</button>
                  <button onClick={() => handleReject(rejectModal)} disabled={processing || !rejectReason.trim()} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50">
                    {processing ? 'Rejecting...' : 'Reject KYC'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">{icon}{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-white/50 text-xs">{label}</p>
      <p className="text-white/80 text-sm mt-0.5">{value || 'Not provided'}</p>
    </div>
  )
}
