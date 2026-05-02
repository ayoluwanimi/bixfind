import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, phone } = body

    const results: { email?: { valid: boolean; message: string }; phone?: { valid: boolean; message: string } } = {}

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isValid = emailRegex.test(email)
      
      const disposableDomains = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com']
      const isDisposable = disposableDomains.some(domain => email.toLowerCase().includes(domain))
      
      results.email = {
        valid: isValid && !isDisposable,
        message: isValid ? (isDisposable ? 'Please use a permanent email' : 'Valid email') : 'Invalid email format'
      }
    }

    if (phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
      const isValid = phoneRegex.test(cleanPhone)
      
      results.phone = {
        valid: isValid,
        message: isValid ? 'Valid phone number' : 'Invalid phone number format'
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
