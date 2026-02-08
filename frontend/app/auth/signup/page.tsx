'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Mail } from 'lucide-react'
import { signupSchema, SignupFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { emailTemplates, sendEmail } from '../../../lib/email'
import { FormInput } from '../../../components/FormInput'

export default function Signup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verificationStep, setVerificationStep] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Send verification email
      await sendEmail(emailTemplates.verificationEmail(code, data.email))

      // Store pending user data
      storage.set('pending_signup', {
        ...data,
        verificationCode: code,
        timestamp: Date.now(),
      })

      setUserEmail(data.email)
      setVerificationStep(true)
    } catch (err) {
      setError('Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = () => {
    const pending = storage.get('pending_signup')

    if (!pending) {
      setError('Session expired. Please sign up again.')
      return
    }

    if (Date.now() - pending.timestamp > 24 * 60 * 60 * 1000) {
      setError('Verification code expired. Please sign up again.')
      return
    }

    if (verificationCode !== pending.verificationCode) {
      setError('Invalid verification code.')
      return
    }

    // Create user account
    const newUser = {
      id: `user_${Date.now()}`,
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      userType: pending.userType,
      verified: true,
      createdAt: new Date().toISOString(),
      wallet: { balance: 0, transactions: [] },
    }

    storage.setUser(newUser)
    storage.set('pending_signup', null)

    // Send welcome email
    sendEmail(emailTemplates.welcomeEmail(pending.fullName, pending.email))

    // Redirect
    const path = pending.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
    router.push(path)
  }

  if (verificationStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900">
        {/* Navigation */}
        <div className="bg-white/10 border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
              <span className="text-2xl font-bold text-white">BIXFIND</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
            <p className="text-gray-600 mt-2">We sent a verification code to {userEmail}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Verify Email
            </button>

            <p className="text-sm text-gray-600 text-center">
              Didn't receive the code?{' '}
              <button
                onClick={() => setVerificationStep(false)}
                className="text-blue-600 hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900">
      {/* Navigation */}
      <div className="bg-white/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <span className="text-2xl font-bold text-white">BIXFIND</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
              <p className="text-gray-600 mt-2">Join Bixfind - Find Every Service, Every Provider</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                label="Full Name"
                placeholder="John Doe"
                required
                {...register('fullName')}
                error={errors.fullName}
              />

              <FormInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                required
                {...register('email')}
                error={errors.email}
              />

              <FormInput
                label="Phone (Optional)"
                placeholder="+1234567890"
                {...register('phone')}
                error={errors.phone}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select
                  {...register('userType')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">I want to find services</option>
                  <option value="provider">I want to provide services</option>
                </select>
              </div>

              <FormInput
                label="Password"
                type="password"
                placeholder="••••••••"
                required
                {...register('password')}
                error={errors.password}
                helpText="Min 8 chars, 1 uppercase, 1 number"
              />

              <FormInput
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                required
                {...register('confirmPassword')}
                error={errors.confirmPassword}
              />

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('agreeTerms')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to Terms and Conditions
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-red-500 text-sm mt-1">{errors.agreeTerms.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="text-sm text-center text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
