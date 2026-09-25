import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bixfind.indevs.in'

    // Try admin client to bypass Supabase email rate limits
    const admin = getAdminClient()
    if (admin) {
      const { error } = await admin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${appUrl}/auth/reset-password`,
      })
      if (!error) {
        return NextResponse.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        })
      }
    }

    // Fallback: try regular client
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })

    if (error) {
      console.warn('Forgot password email send failed:', error.message)
    }

    // Always return success to avoid user enumeration
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('Forgot password error:', msg)
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    })
  }
}

function getAdminClient() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createAdminClient()
  } catch {
    return null
  }
}
