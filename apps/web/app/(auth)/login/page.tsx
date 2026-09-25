'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { loginSchema, LoginFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { requestNotificationPermission } from '../../../lib/notifications'

declare const crypto: CryptoLite

interface CryptoLite {
  subtle: {
    digest: (algorithm: string, data: ArrayBuffer) => Promise<ArrayBuffer>
  }
}

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

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const user = storage.getUser()
    const token = storage.getToken()
    if (user && token) {
      const userType = user.user_metadata?.user_type || user.user_metadata?.role
      const path = userType === 'admin' ? '/admin/overview' :
                   userType === 'provider' ? '/provider/today' : '/dashboard'
      router.push(path)
    }
  }, [router])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        storage.setUser(result.user)
        storage.setToken(result.session.access_token)
        toast.success('Welcome back!')
        const userType = result.user.user_metadata?.user_type || result.user.user_metadata?.role
        const path = userType === 'admin' ? '/admin/overview' :
                     userType === 'provider' ? '/provider/today' : '/dashboard'
        router.push(path)
      } else {
        setError(result.error || 'Invalid email or password')
        toast.error(result.error || 'Invalid email or password')
      }
    } catch (err: any) {
      const message = err.message || 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
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
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </motion.div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Welcome Back</h1>
          <p className="text-blue-200/70 mt-2">Sign in to your account</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-blue-200/50">Sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div
            className="relative"
            variants={itemVariants}
            custom={1}
            initial="hidden"
            animate="visible"
          >
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div
            className="relative"
            variants={itemVariants}
            custom={2}
            initial="hidden"
            animate="visible"
          >
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.password.message}</p>
            )}
          </motion.div>

          <motion.div
            className="flex items-center justify-between text-sm"
            variants={itemVariants}
            custom={3}
            initial="hidden"
            animate="visible"
          >
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-blue-200/60 group-hover:text-blue-200/80 transition-colors">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-blue-300/60 hover:text-blue-300 transition-colors"
            >
              Forgot Password?
            </Link>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            variants={itemVariants}
            custom={4}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/20 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.p
            className="text-sm text-center text-blue-200/50"
            variants={itemVariants}
            custom={5}
            initial="hidden"
            animate="visible"
          >
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white hover:text-blue-200 transition-colors font-semibold">
              Sign Up
            </Link>
          </motion.p>
        </form>
      </motion.div>
    </motion.div>
  )
}
