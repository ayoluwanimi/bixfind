'use client'

import { useWallet, useWalletTransactions, usePayout } from "@bixfind/core"
import { useState, useEffect } from "react"
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle, Plus, Banknote, ExternalLink } from "lucide-react"

function KoboDisplay({ kobo }: { kobo: number }) {
  const naira = (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
  return <span>{naira}</span>
}

function EntryIcon({ type }: { type: string }) {
  switch (type) {
    case "CREDIT":
    case "RELEASE":
      return <ArrowDownLeft className="w-4 h-4 text-green-400" />
    case "DEBIT":
    case "PAYOUT":
      return <ArrowUpRight className="w-4 h-4 text-red-400" />
    case "HOLD":
      return <Clock className="w-4 h-4 text-yellow-400" />
    case "REFUND":
      return <ArrowDownLeft className="w-4 h-4 text-blue-400" />
    default:
      return <AlertCircle className="w-4 h-4 text-white/40" />
  }
}

export default function ProviderFinancePage() {
  const { data: wallet, isLoading: walletLoading, error: walletError } = useWallet()
  const { data: txData, isLoading: txLoading } = useWalletTransactions()
  const { requestPayout, isProcessing, payoutHistory } = usePayout()

  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [amount, setAmount] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [payoutError, setPayoutError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/provider/payment-settings')
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setBankCode(res.data.bankCode || '')
          setAccountNumber(res.data.accountNumber || '')
          setAccountName(res.data.accountName || '')
        }
      })
      .catch(() => {})
  }, [])

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)
    if (!amount || !bankCode || !accountNumber || !accountName || !mfaCode) {
      setPayoutError("All fields are required")
      return
    }
    try {
      requestPayout({
        amount: Math.round(parseFloat(amount) * 100),
        bankCode,
        accountNumber,
        accountName,
        mfaCode,
      })
      setShowPayoutModal(false)
      setAmount("")
      setMfaCode("")
    } catch {
      setPayoutError("Payout failed. Please try again.")
    }
  }

  if (walletLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-white/60 mt-1">Manage your earnings and payouts</p>
        </div>
        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={!wallet || wallet.available <= 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors"
        >
          <Banknote className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Wallet className="w-4 h-4" />
            Available Balance
          </div>
          <p className="text-3xl font-bold text-white">
            {wallet ? <KoboDisplay kobo={wallet.available} /> : "—"}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Clock className="w-4 h-4" />
            Pending Hold
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {wallet ? <KoboDisplay kobo={wallet.pending} /> : "—"}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
            <Wallet className="w-4 h-4" />
            Total Balance
          </div>
          <p className="text-3xl font-bold text-white">
            {wallet ? <KoboDisplay kobo={wallet.balance} /> : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-white/10">
          {txLoading ? (
            <div className="p-8 text-center text-white/40">Loading transactions...</div>
          ) : !txData?.entries?.length ? (
            <div className="p-8 text-center text-white/40">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No transactions yet
            </div>
          ) : (
            txData.entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <EntryIcon type={entry.entryType} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{entry.description ?? entry.entryType}</p>
                    <p className="text-white/40 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium text-sm ${
                    ["CREDIT", "RELEASE", "REFUND"].includes(entry.entryType)
                      ? "text-green-400"
                      : ["DEBIT", "PAYOUT"].includes(entry.entryType)
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}>
                    {["CREDIT", "RELEASE", "REFUND"].includes(entry.entryType) ? "+" : ""}
                    <KoboDisplay kobo={entry.amount} />
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {payoutHistory.data?.payouts && payoutHistory.data.payouts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Payout History</h2>
          </div>
          <div className="divide-y divide-white/10">
            {payoutHistory.data.payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white text-sm">
                    <KoboDisplay kobo={payout.amount} />
                  </p>
                  <p className="text-white/40 text-xs">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  payout.status === "success" ? "bg-green-500/20 text-green-400" :
                  payout.status === "failed" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Request Payout</h2>
            {wallet && (
              <p className="text-sm text-white/60 mb-4">
                Available: <KoboDisplay kobo={wallet.available} />
              </p>
            )}

            <form onSubmit={handlePayout} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Amount (kobo)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Bank Code</label>
                  <input
                    type="text"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="e.g. 044"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="10 digits"
                    maxLength={10}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name on bank account"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1 block">MFA Code</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Enter 2FA code"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  autoComplete="one-time-code"
                />
              </div>

              {payoutError && (
                <p className="text-red-400 text-sm">{payoutError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors text-sm"
                >
                  {isProcessing ? "Processing..." : "Send Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
