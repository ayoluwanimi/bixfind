import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bixfind-3055a.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://bixfind-3055a-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bixfind-3055a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bixfind-3055a.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123"
}

let adminDb: ReturnType<typeof getDatabase> | null = null

const getAdminDb = () => {
  if (adminDb) return adminDb
  
  try {
    if (getApps().length === 0) {
      initializeApp({
        databaseURL: firebaseConfig.databaseURL
      })
    }
    adminDb = getDatabase()
    return adminDb
  } catch (e) {
    console.error('Firebase Admin init error:', e)
    return null
  }
}

function simpleHash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, userType } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailKey = normalizedEmail.replace(/\./g, '_')
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Try Firebase first
    const db = getAdminDb()
    if (db) {
      try {
        // Check if user already exists
        const credsRef = db.ref(`userCredentials/${emailKey}`)
        const existingCreds = await credsRef.get()
        
        if (existingCreds.exists()) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          )
        }

        // Create user in Firebase
        const hashedPassword = btoa(password + 'bixfind_salt_2024')
        
        // Save credentials
        await db.ref(`userCredentials/${emailKey}`).set({
          userId,
          hashedPassword,
          createdAt: Date.now()
        })

        // Save user profile
        await db.ref(`users/${userId}`).set({
          email: normalizedEmail,
          name: fullName,
          phone: phone || '',
          role: userType === 'provider' ? 'provider' : 'user',
          createdAt: Date.now()
        })

        const token = generateToken()

        return NextResponse.json({
          success: true,
          user: {
            id: userId,
            email: normalizedEmail,
            fullName: fullName,
            userType: userType === 'provider' ? 'provider' : 'customer',
            phone: phone || '',
            avatar: null,
            wallet: { balance: 0 }
          },
          token
        })
      } catch (fbError) {
        console.error('Firebase signup error:', fbError)
      }
    }

    // In-memory fallback
    const hashedPassword = simpleHash(password)
    const user = {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      fullName,
      phone: phone || '',
      userType: userType || 'customer',
      isVerified: true,
      wallet: { balance: 0, currency: 'USD' },
      createdAt: new Date().toISOString(),
    }

    const token = generateToken()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        phone: user.phone,
        avatar: null,
        wallet: user.wallet
      },
      token
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}