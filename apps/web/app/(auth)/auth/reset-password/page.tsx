'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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

export default function ResetPassword() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
        setSessionReady(false)
      }
    })
  }, [supabase])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setError(''); setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError(updateError.message)
      toast.error(updateError.message)
    } else {
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => router.push('/login'), 2500)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <motion.div variants={formVariants} initial="hidden" animate="visible">
        <motion.div
          className="backdrop-blur-2xl bg-white/[0.05] border border-white/[0.08] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/20 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-blue-200/70 mb-6">Your password has been updated successfully.</p>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20"
          >
            Sign In
          </Link>
        </motion.div>
      </motion.div>
    )
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
            <Lock className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Set New Password</h1>
          <p className="text-blue-200/70 mt-2">Enter your new password below.</p>
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

        {sessionReady ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset(e as any)}
                placeholder="Confirm New Password"
                className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors duration-200"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        ) : (
          !error && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-blue-200/70">Verifying your reset link...</p>
            </div>
          )
        )}

        <motion.p
          className="text-sm text-center text-blue-200/50 mt-6"
          variants={itemVariants}
          custom={5}
          initial="hidden"
          animate="visible"
        >
          <Link href="/login" className="text-white hover:text-blue-200 transition-colors font-semibold">
            Back to Sign In
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
