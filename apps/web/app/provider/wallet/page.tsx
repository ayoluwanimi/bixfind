'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Minus, X, Check, CreditCard, History, TrendingUp, Clock } from 'lucide-react'
import { storage } from '@/lib/storage'

export default function ProviderWalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] as any[] })
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [toast, setToast] = useState('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') { router.push('/login'); return }
    setUser(currentUser)
    setWallet(storage.getWallet() || { balance: 0, transactions: [] })
    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  const handleAddFunds = () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) return
    const updated = {
      balance: wallet.balance + val,
      transactions: [
        { id: `tx_${Date.now()}`, type: 'credit', amount: val, description: 'Funds added to wallet', date: new Date().toISOString() },
        ...wallet.transactions,
      ],
    }
    setWallet(updated)
    storage.setWallet(updated)
    setShowAddFunds(false)
    setAmount('')
    showToast(`₦${val.toLocaleString()} added to wallet`)
  }

  const handleWithdraw = () => {
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0 || val > wallet.balance) return
    const updated = {
      balance: wallet.balance - val,
      transactions: [
        { id: `tx_${Date.now()}`, type: 'debit', amount: val, description: 'Withdrawal to bank', date: new Date().toISOString() },
        ...wallet.transactions,
      ],
    }
    setWallet(updated)
    storage.setWallet(updated)
    setShowWithdraw(false)
    setAmount('')
    showToast(`₦${val.toLocaleString()} withdrawn`)
  }

  const totalCredits = wallet.transactions
    .filter((t: any) => t.type === 'credit')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const totalDebits = wallet.transactions
    .filter((t: any) => t.type === 'debit')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const pendingPayouts = wallet.transactions
    .filter((t: any) => t.type === 'debit' && t.description?.includes('pending'))
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-white/50 mt-1">Manage your earnings and withdrawals</p>
      </motion.div>

      <motion.div
        className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white rounded-2xl p-8 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <WalletIcon className="w-6 h-6 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">Available Balance</span>
          </div>
          <p className="text-6xl font-bold tracking-tight">₦{wallet.balance.toLocaleString()}</p>
          <div className="flex gap-3 mt-2 text-sm text-blue-200">
            <span className="flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-green-300" /> In: ₦{totalCredits.toLocaleString()}</span>
            <span className="flex items-center gap-1"><ArrowDownLeft className="w-4 h-4 text-red-300" /> Out: ₦{totalDebits.toLocaleString()}</span>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowAddFunds(true)}
              className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add Funds
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="border-2 border-white/40 text-white px-6 py-3 rounded-xl font-semibold hover:border-white transition flex items-center gap-2"
            >
              <Minus className="w-5 h-5" /> Withdraw
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: `₦${totalCredits.toLocaleString()}`, color: 'text-green-400', icon: TrendingUp },
          { label: 'Withdrawn', value: `₦${totalDebits.toLocaleString()}`, color: 'text-red-400', icon: ArrowDownLeft },
          { label: 'Pending Payouts', value: `₦${pendingPayouts.toLocaleString()}`, color: 'text-yellow-400', icon: Clock },
          { label: 'Available Balance', value: `₦${wallet.balance.toLocaleString()}`, color: 'text-purple-400', icon: CreditCard },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-white/60 text-xs">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="bg-white/5 border border-white/10 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-400" /> Transaction History
        </h3>

        {wallet.transactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No transactions yet</p>
            <p className="text-white/30 text-sm mt-1">Your earnings and withdrawals will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {wallet.transactions.map((tx: any) => (
              <motion.div
                key={tx.id}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/5 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {tx.type === 'credit'
                      ? <ArrowUpRight className="w-5 h-5 text-green-400" />
                      : <ArrowDownLeft className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{tx.description}</p>
                    <p className="text-xs text-white/40">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAddFunds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddFunds(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-green-400" /> Add Funds</h3>
                <button onClick={() => setShowAddFunds(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-2xl font-bold placeholder-white/20 mb-4"
              />
              <div className="flex gap-2 mb-6">
                {[5000, 10000, 25000, 50000, 100000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="flex-1 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition text-center"
                  >₦{amt.toLocaleString()}</button>
                ))}
              </div>
              <p className="text-xs text-white/30 mb-4">Funds are credited instantly. No fees apply.</p>
              <button
                onClick={handleAddFunds}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Add ₦{amount ? parseFloat(amount).toLocaleString() : '0'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWithdraw(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2"><Minus className="w-5 h-5 text-red-400" /> Withdraw</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-2xl font-bold placeholder-white/20 mb-4"
              />
              <div className="flex gap-2 mb-6">
                {[5000, 10000, 25000, 50000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="flex-1 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition text-center"
                  >₦{amt.toLocaleString()}</button>
                ))}
              </div>
              <p className="text-xs text-white/30 mb-2">Available balance: ₦{wallet.balance.toLocaleString()}</p>
              <p className="text-xs text-white/30 mb-4">Withdrawals processed within 24 hours to your bank account.</p>
              <button
                onClick={handleWithdraw}
                disabled={!amount || parseFloat(amount) > wallet.balance}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw ₦{amount ? parseFloat(amount).toLocaleString() : '0'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
