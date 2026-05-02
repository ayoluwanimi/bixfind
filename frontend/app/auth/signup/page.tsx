'use client'

 import { useState, useEffect } from 'react'
 import { useRouter } from 'next/navigation'
 import Link from 'next/link'
 import { useForm } from 'react-hook-form'
 import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { signupSchema, SignupFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { requestNotificationPermission } from '../../../lib/notifications'

export default function Signup() {
   const router = useRouter()
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState('')
   const [validating, setValidating] = useState({ email: false, phone: false })
   const [validation, setValidation] = useState({ email: { valid: false, checked: false }, phone: { valid: false, checked: false } })
   const [showPassword, setShowPassword] = useState(false)
   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

   useEffect(() => {
     const user = storage.getUser()
     const token = storage.getToken()
     if (user && token) {
       const path = user.userType === 'admin' ? '/admin/dashboard' : 
                    user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
       router.push(path)
     }
   }, [router])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

const API_BASE = 'https://api-eal2ibekhq-uc.a.run.app'

  const validateField = async (field: 'email' | 'phone', value: string) => {
    if (!value || value.length < 3) return
    
    setValidating(prev => ({ ...prev, [field]: true }))
    
    try {
      const response = await axios.post(`${API_BASE}/validate`, {
        [field]: value
      })
      
      setValidation(prev => ({
        ...prev,
        [field]: {
          valid: response.data.results[field]?.valid || false,
          checked: true
        }
      }))
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setValidating(prev => ({ ...prev, [field]: false }))
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    if (validation.email.checked && !validation.email.valid) {
      toast.error('Please enter a valid email address')
      return
    }

    if (data.phone && validation.phone.checked && !validation.phone.valid) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE}/signup`, {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        userType: data.userType,
      })

      if (response.data.success) {
        storage.setUser(response.data.user)
        if (response.data.token) {
          storage.setToken(response.data.token)
        }
        toast.success('Account created successfully!')
        
        requestNotificationPermission()
        
        setTimeout(() => {
          const path = data.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
          router.push(path)
        }, 500)
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create account'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

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
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-blue-200 mt-2">Join Bixfind today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('fullName')}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.fullName.message}</p>
                )}
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email Address"
                  onBlur={(e) => validateField('email', e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {validating.email && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                  {validation.email.checked && !validating.email && (
                    validation.email.valid 
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="Phone Number (e.g., 09027612999)"
                  onBlur={(e) => validateField('phone', e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {validating.phone && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                  {validation.phone.checked && !validating.phone && (
                    validation.phone.valid 
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1 ml-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  I want to: <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${watch('userType') === 'customer' ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 hover:border-white/40'}`}>
                    <input
                      type="radio"
                      {...register('userType')}
                      value="customer"
                      className="sr-only"
                    />
                    <div className="text-center">
                      <span className="text-4xl block mb-2">🔍</span>
                      <span className={`text-sm font-semibold ${watch('userType') === 'customer' ? 'text-white' : 'text-blue-200'}`}>Find Services</span>
                      <p className="text-xs text-blue-300 mt-1">I'm looking for service providers</p>
                    </div>
                    {watch('userType') === 'customer' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                  <label className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${watch('userType') === 'provider' ? 'border-green-500 bg-green-500/20' : 'border-white/20 hover:border-white/40'}`}>
                    <input
                      type="radio"
                      {...register('userType')}
                      value="provider"
                      className="sr-only"
                    />
                    <div className="text-center">
                      <span className="text-4xl block mb-2">🛠️</span>
                      <span className={`text-sm font-semibold ${watch('userType') === 'provider' ? 'text-white' : 'text-green-200'}`}>Provide Services</span>
                      <p className="text-xs text-green-300 mt-1">I want to offer my services</p>
                    </div>
                    {watch('userType') === 'provider' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                </div>
                {errors.userType && (
                  <p className="text-red-400 text-sm mt-2">{errors.userType.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('agreeTerms')}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-blue-200">
                    I agree to the Terms and Conditions
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-red-400 text-sm mt-1">{errors.agreeTerms.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-center text-blue-200 mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-white hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
