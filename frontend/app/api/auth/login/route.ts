import { NextResponse } from 'next/server'
import crypto from 'crypto'

// SHA256 hash matching existing users
function sha256Hash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Check admin hardcoded credentials
    if (normalizedEmail === 'ayoluwanimi@gmail.com' && password === 'Community@1997') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin_001',
          email: 'ayoluwanimi@gmail.com',
          fullName: 'Admin User',
          userType: 'admin',
          phone: '08012345678',
          avatar: null,
          wallet: { balance: 0 }
        },
        token: crypto.randomBytes(32).toString('hex')
      })
    }

    // 2. Use Firebase REST API to fetch users directly
    try {
      const usersRes = await fetch('https://bixfind-3055a-default-rtdb.firebaseio.com/users.json', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (usersRes.ok) {
        const users = await usersRes.json()
        
        if (users) {
          // Find user by email
          for (const [userId, userData] of Object.entries(users) as [string, any][]) {
            if (userData.email?.toLowerCase() === normalizedEmail) {
              // Check password - existing users have SHA256 hashed passwords
              const hashedPassword = sha256Hash(password)
              
              if (userData.password === hashedPassword) {
                return NextResponse.json({
                  success: true,
                  user: {
                    id: userId,
                    email: userData.email,
                    fullName: userData.fullName,
                    userType: userData.userType || 'user',
                    phone: userData.phone || '',
                    avatar: userData.avatar || null,
                    wallet: userData.wallet || { balance: 0 }
                  },
                  token: crypto.randomBytes(32).toString('hex')
                })
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('REST API lookup error:', e)
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}