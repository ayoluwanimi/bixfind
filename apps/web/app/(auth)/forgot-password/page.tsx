'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email address'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setSent(true)
        toast.success('Check your email for the reset link')
      } else {
        setError(data.error || 'Something went wrong')
        toast.error(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
      toast.error('Network error')
    } finally { setLoading(false) }
  }

  return (
    <motion.div variants={formVariants} initial="hidden" animate="visible">
      <motion.div
        className="backdrop-blur-2xl bg-white/[0.05] border border-white/[0.08] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-8"
          variants={itemVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20"
            whileHover={{ rotate: 5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <KeyRound className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200/70 mt-2">
            {sent
              ? 'Reset link sent — check your email'
              : 'Enter your email to receive a reset link'}
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {sent ? (
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            <p className="text-white/80">
              If an account with <strong className="text-white">{email}</strong> exists,
              you'll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20"
            >
              Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <><span>Send Reset Link</span><ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}

        <motion.p
          className="text-sm text-center text-blue-200/50 mt-6"
          variants={itemVariants}
          custom={5}
          initial="hidden"
          animate="visible"
        >
          Remember your password?{' '}
          <Link href="/login" className="text-white hover:text-blue-200 transition-colors font-semibold">
            Sign In
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
