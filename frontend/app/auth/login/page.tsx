'use client'

 import { useState, useEffect } from 'react'
 import { useRouter } from 'next/navigation'
 import Link from 'next/link'
 import { useForm } from 'react-hook-form'
 import { zodResolver } from '@hookform/resolvers/zod'
 import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { loginSchema, LoginFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { requestNotificationPermission } from '../../../lib/notifications'

declare const crypto: CryptoLite

interface CryptoLite {
  subtle: {
    digest: (algorithm: string, data: ArrayBuffer) => Promise<ArrayBuffer>
  }
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
       const path = user.userType === 'admin' ? '/admin/dashboard' : 
                    user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
       router.push(path)
     }
   }, [router])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    try {
      // 1. Check hardcoded admin credentials first (always works)
      if (data.email.toLowerCase() === 'ayoluwanimi@gmail.com' && data.password === 'Community@1997') {
        storage.setUser({ id: 'admin_001', email: 'ayoluwanimi@gmail.com', fullName: 'Admin User', userType: 'admin', phone: '08012345678', wallet: { balance: 0 } })
        toast.success('Welcome back, Admin!')
        router.push('/admin/dashboard')
        setLoading(false)
        return
      }
      
      // 2. Try Supabase (if configured)
      const { supabase, isSupabaseConfigured } = await import('../../lib/supabase')
      if (isSupabaseConfigured()) {
        try {
          const result = await supabase.loginWithEmail(data.email, data.password)
          if (result.data) {
            storage.setUser(result.data)
            storage.setToken(result.session?.access_token || 'supabase_token')
            toast.success('Welcome back!')
            const path = result.data.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
            router.push(path)
            setLoading(false)
            return
          }
        } catch (supabaseErr) {
          console.log('Supabase not available, using fallback')
        }
      }
      
      // 3. Fallback: local data (for demo)
      const { fallbackUsers, ADMIN_CREDENTIALS } = await import('../../lib/supabase-config')
      const allUsers = { ...fallbackUsers }
      
      for (const [userId, user] of Object.entries(allUsers) as [string, any][]) {
        if (user.email?.toLowerCase() === data.email.toLowerCase()) {
          // SHA256 hash check using Web Crypto API
          const msgBuffer = new TextEncoder().encode(data.password)
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          
          if (user.password === hashed) {
            storage.setUser({ id: userId, email: user.email, fullName: user.fullName, userType: user.userType, phone: user.phone, wallet: user.wallet })
            toast.success('Welcome back!')
            const path = user.userType === 'admin' ? '/admin/dashboard' : user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
            router.push(path)
            setLoading(false)
            return
          }
        }
      }
      
      setError('Invalid email or password')
      toast.error('Invalid email or password')
    } catch (err: any) {
      const message = err.message || 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>

      <div className="bg-white/5 border-b border-white/10 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold text-white">BIXFIND</span>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="text-blue-200 mt-2">Sign in to continue</p>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-blue-200">Sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-blue-200">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-blue-200 hover:text-white transition">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-sm text-center text-blue-200">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-white hover:underline font-semibold">
                  Sign Up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
