'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DollarSign, Wallet, TrendingUp, Percent, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock, Banknote, RefreshCw, Loader2, CreditCard, Eye, EyeOff, Save, Globe } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function AdminMoneyPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [wallet, setWallet] = useState<any>({ balance: 0, transactions: [] })
  const [allWallets, setAllWallets] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [payoutRequests, setPayoutRequests] = useState<any[]>([])
  const [paymentGateway, setPaymentGateway] = useState<'paystack' | 'flutterwave'>('paystack')
  const [gatewayKeys, setGatewayKeys] = useState<Record<string, string>>({})
  const [gatewaySaved, setGatewaySaved] = useState(false)
  const [gatewayError, setGatewayError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

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

    const userWallet = storage.getWallet() || { balance: 0, transactions: [] }
    const savedWallets = storage.get('all_wallets') || []
    const registeredProviders = storage.get('registered_providers') || []
    const savedPayouts = storage.get('payout_requests') || []

    setWallet(userWallet)
    setAllWallets(savedWallets)
    setProviders(registeredProviders)
    setPayoutRequests(savedPayouts)

    const savedConfig = storage.get('payment_gateway_config')
    if (savedConfig) {
      setPaymentGateway(savedConfig.active || 'paystack')
      setGatewayKeys(savedConfig.keys || {})
    }
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const totalRevenue = [wallet, ...allWallets].reduce((sum: number, w: any) => sum + (w?.balance || 0), 0)
  const platformFeeRate = 0.05

  const allTransactions: any[] = []
  ;[wallet, ...allWallets].forEach((w: any) => {
    if (w?.transactions) {
      allTransactions.push(...w.transactions.map((t: any) => ({ ...t, walletUser: w.userName || w.userId || 'System' })))
    }
  })
  allTransactions.sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())

  const pendingPayouts = payoutRequests.filter((p: any) => p.status === 'pending')
  const totalFees = allTransactions.filter(t => t.type === 'fee' || t.type === 'platform_fee').reduce((s: number, t: any) => s + (t.amount || 0), 0)
  const txnVolume = allTransactions.reduce((s: number, t: any) => s + (t.amount || 0), 0)

  const revenueCards = [
    { icon: DollarSign, label: 'Total Platform Revenue', value: `₦${totalRevenue.toLocaleString()}`, sub: 'Across all wallets', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Clock, label: 'Pending Payouts', value: `₦${pendingPayouts.reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}`, sub: `${pendingPayouts.length} requests`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Percent, label: 'Platform Fees Collected', value: `₦${totalFees.toLocaleString()}`, sub: `${(platformFeeRate * 100).toFixed(1)}% rate`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: TrendingUp, label: 'Transaction Volume', value: `₦${txnVolume.toLocaleString()}`, sub: `${allTransactions.length} transactions`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  const handleApprovePayout = (id: string) => {
    const updated = payoutRequests.map((p: any) => p.id === id ? { ...p, status: 'approved' } : p)
    storage.set('payout_requests', updated)
    setPayoutRequests(updated)
  }

  const handleRejectPayout = (id: string) => {
    const updated = payoutRequests.map((p: any) => p.id === id ? { ...p, status: 'rejected' } : p)
    storage.set('payout_requests', updated)
    setPayoutRequests(updated)
  }

  const handleSaveGateway = () => {
    setSaving(true)
    setGatewayError('')
    try {
      storage.set('payment_gateway_config', { active: paymentGateway, keys: gatewayKeys })
      setGatewaySaved(true)
      setTimeout(() => setGatewaySaved(false), 3000)
    } catch {
      setGatewayError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const gatewayFields = paymentGateway === 'paystack'
    ? [
        { key: 'PAYSTACK_PUBLIC_KEY', label: 'Public Key', placeholder: 'pk_live_...' },
        { key: 'PAYSTACK_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_...' },
      ]
    : [
        { key: 'FLUTTERWAVE_PUBLIC_KEY', label: 'Public Key', placeholder: 'FLWPUBK-...' },
        { key: 'FLUTTERWAVE_SECRET_KEY', label: 'Secret Key', placeholder: 'FLWSECK-...' },
        { key: 'FLUTTERWAVE_ENCRYPTION_KEY', label: 'Encryption Key', placeholder: 'FLWSECK-...' },
      ]

  if (!admin) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-white/60">Loading...</p></div>

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
        <p className="text-white/60 mt-1">Revenue, payouts, and transaction monitoring</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {revenueCards.map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/60 mt-1">{card.label}</p>
            <p className="text-xs text-white/40">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-400" />Recent Transactions</h2>
          {allTransactions.length === 0 ? (
            <p className="text-white/40 text-sm py-8 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allTransactions.slice(0, 20).map((txn: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'deposit' || txn.type === 'credit' ? 'bg-green-500/20' : txn.type === 'withdrawal' || txn.type === 'debit' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                      {txn.type === 'deposit' || txn.type === 'credit' ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownLeft className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-white capitalize font-medium">{txn.type || 'Transaction'}</p>
                      <p className="text-xs text-white/40">{txn.walletUser} • {txn.date ? new Date(txn.date).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${txn.type === 'deposit' || txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.type === 'deposit' || txn.type === 'credit' ? '+' : '-'}₦{(txn.amount || 0).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${txn.status === 'completed' || txn.status === 'success' ? 'bg-green-500/20 text-green-400' : txn.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      {txn.status || 'completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-yellow-400" />Payout Requests</h2>
          {pendingPayouts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-400/50 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No pending payout requests</p>
              <p className="text-white/30 text-xs mt-1">All payouts have been processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.map((payout: any, i: number) => (
                <motion.div key={payout.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">{payout.userName || payout.userId || 'Provider'}</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">₦{(payout.amount || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{payout.bankName || 'Bank Transfer'} • {payout.accountNumber || '—'} • {payout.date ? new Date(payout.date).toLocaleDateString() : ''}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprovePayout(payout.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleRejectPayout(payout.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Percent className="w-5 h-5 text-purple-400" />Platform Fee Settings</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Fee Rate</p>
            <p className="text-2xl font-bold text-white">{(platformFeeRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-400">₦{totalFees.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Pending Settlements</p>
            <p className="text-2xl font-bold text-yellow-400">₦{pendingPayouts.reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" />Payment Gateway Configuration</h2>
        <p className="text-sm text-white/40 mb-6">Configure the payment gateway used for processing transactions on the platform.</p>

        {gatewayError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{gatewayError}</p>}
        {gatewaySaved && <p className="text-green-400 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">Gateway configuration saved successfully</p>}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Active Gateway</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPaymentGateway('paystack')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    paymentGateway === 'paystack'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Paystack
                  {paymentGateway === 'paystack' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
                <button
                  onClick={() => setPaymentGateway('flutterwave')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    paymentGateway === 'flutterwave'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Flutterwave
                  {paymentGateway === 'flutterwave' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {gatewayFields.map(field => (
                <div key={field.key}>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">{field.label}</label>
                  <div className="relative">
                    <input
                      type={showKeys[field.key] ? 'text' : 'password'}
                      value={gatewayKeys[field.key] || ''}
                      onChange={e => setGatewayKeys(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full pr-10 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                    />
                    <button
                      onClick={() => toggleShowKey(field.key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showKeys[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {gatewayKeys[field.key] ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveGateway}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider">Gateway Status</p>
            {gatewayFields.every(f => gatewayKeys[f.key]) ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Fully configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Incomplete configuration</span>
              </div>
            )}
            <p className="text-xs text-white/40">
              {paymentGateway === 'paystack'
                ? 'Paystack supports Visa, Mastercard, Verve, and other payment methods.'
                : 'Flutterwave supports card, bank transfer, USSD, mobile money, and more.'}
            </p>
            <p className="text-xs text-white/30">
              Keys are stored locally. Set them as environment variables for production use.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
