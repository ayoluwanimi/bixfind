'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { signupSchema, SignupFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { requestNotificationPermission } from '../../../lib/notifications'

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
}

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
      const userType = user.user_metadata?.user_type || user.user_metadata?.role
      const path = userType === 'admin' ? '/admin/overview' :
                   userType === 'provider' ? '/provider/today' : '/dashboard'
      router.push(path)
    }
  }, [router])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const validateField = async (field: 'email' | 'phone', value: string) => {
    if (!value || value.length < 3) return
    setValidating(prev => ({ ...prev, [field]: true }))
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await response.json()
      setValidation(prev => ({
        ...prev,
        [field]: {
          valid: data.results?.[field]?.valid || data.valid || false,
          checked: true,
        },
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
          userType: data.userType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        storage.setUser(result.user)
        if (result.session?.access_token) {
          storage.setToken(result.session.access_token)
        }
        toast.success('Account created successfully!')
        requestNotificationPermission()
        setTimeout(() => {
          const path = data.userType === 'provider' ? '/provider/today' : '/dashboard'
          router.push(path)
        }, 500)
      } else {
        setError(result.error || 'Failed to create account')
        toast.error(result.error || 'Failed to create account')
      }
    } catch (err: any) {
      const message = err.message || 'Failed to create account'
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
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200/70 mt-2">Join Bixfind today</p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <motion.div
            className="relative"
            variants={itemVariants}
            custom={1}
            initial="hidden"
            animate="visible"
          >
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('fullName')}
              placeholder="Full Name"
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
            />
            {errors.fullName && (
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.fullName.message}</p>
            )}
          </motion.div>

          <motion.div
            className="relative"
            variants={itemVariants}
            custom={2}
            initial="hidden"
            animate="visible"
          >
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('email')}
              type="email"
              placeholder="Email Address"
              onBlur={(e) => validateField('email', e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
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
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div
            className="relative"
            variants={itemVariants}
            custom={3}
            initial="hidden"
            animate="visible"
          >
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('phone')}
              type="tel"
              placeholder="Phone Number"
              onBlur={(e) => validateField('phone', e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
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
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.phone.message}</p>
            )}
          </motion.div>

          <motion.div
            className="relative"
            variants={itemVariants}
            custom={4}
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
            className="relative"
            variants={itemVariants}
            custom={5}
            initial="hidden"
            animate="visible"
          >
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/40" />
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/[0.08]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/50 hover:text-white transition-colors duration-200"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1.5 ml-1">{errors.confirmPassword.message}</p>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={6}
            initial="hidden"
            animate="visible"
          >
            <label className="block text-sm font-medium text-blue-200/80 mb-3">
              I want to: <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  watch('userType') === 'customer'
                    ? 'border-blue-500 bg-blue-500/15 shadow-lg shadow-blue-500/10'
                    : 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <input type="radio" {...register('userType')} value="customer" className="sr-only" />
                <div className="text-center">
                  <span className="text-4xl block mb-2">🔍</span>
                  <span className={`text-sm font-semibold ${watch('userType') === 'customer' ? 'text-white' : 'text-blue-200/70'}`}>
                    Find Services
                  </span>
                  <p className="text-xs text-blue-300/50 mt-1">I&apos;m looking for service providers</p>
                </div>
                {watch('userType') === 'customer' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>
              <label
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  watch('userType') === 'provider'
                    ? 'border-green-500 bg-green-500/15 shadow-lg shadow-green-500/10'
                    : 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <input type="radio" {...register('userType')} value="provider" className="sr-only" />
                <div className="text-center">
                  <span className="text-4xl block mb-2">🛠️</span>
                  <span className={`text-sm font-semibold ${watch('userType') === 'provider' ? 'text-white' : 'text-green-200/70'}`}>
                    Provide Services
                  </span>
                  <p className="text-xs text-green-300/50 mt-1">I want to offer my services</p>
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
          </motion.div>

          <motion.div
            variants={itemVariants}
            custom={7}
            initial="hidden"
            animate="visible"
          >
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                {...register('agreeTerms')}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500/50 focus:ring-offset-0 border-white/20 bg-white/10 cursor-pointer"
              />
              <span className="text-sm text-blue-200/60 group-hover:text-blue-200/80 transition-colors">
                I agree to the Terms and Conditions
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-red-400 text-sm mt-1">{errors.agreeTerms.message}</p>
            )}
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            variants={itemVariants}
            custom={8}
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
                Creating Account...
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.p
            className="text-sm text-center text-blue-200/50"
            variants={itemVariants}
            custom={9}
            initial="hidden"
            animate="visible"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-blue-200 transition-colors font-semibold">
              Sign In
            </Link>
          </motion.p>
        </form>
      </motion.div>
    </motion.div>
  )
}
