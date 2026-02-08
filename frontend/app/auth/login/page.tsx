'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { loginSchema, LoginFormData } from '../../../lib/validations'
import { storage } from '../../../lib/storage'
import { FormInput } from '../../../components/FormInput'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      // Check if user exists in localStorage
      const allUsers = storage.get('all_users') || []
      const user = allUsers.find((u: any) => u.email === data.email)

      if (!user) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // For demo, accept any password
      storage.setUser({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        verified: user.verified,
      })

      // Redirect based on user type
      const path = user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'
      router.push(path)
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <LogIn className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600 mt-2">Welcome back to Bixfind</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            required
            {...register('email')}
            error={errors.email}
          />

          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            {...register('password')}
            error={errors.password}
          />

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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
              Forgot Password?
            </Link>
            <Link href="/auth/signup" className="text-blue-600 hover:underline">
              Create Account
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Demo: Use any registered email to login
          </p>
        </div>
      </div>
    </div>
  )
}
