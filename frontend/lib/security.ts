// Security utilities for BixFind

import DOMPurify from 'isomorphic-dompurify'

// Generate CSRF token
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Store CSRF token
let csrfToken: string | null = null
export const getCSRFToken = (): string => {
  if (!csrfToken) {
    csrfToken = generateCSRFToken()
  }
  return csrfToken
}

// Validate CSRF token
export const validateCSRFToken = (token: string): boolean => {
  return token === csrfToken && csrfToken !== null
}

// Rate limiter for preventing spam
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(key: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(key) || []
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs)
    
    if (validTimestamps.length >= this.maxRequests) {
      return false
    }
    
    validTimestamps.push(now)
    this.requests.set(key, validTimestamps)
    return true
  }

  reset(key: string): void {
    this.requests.delete(key)
  }
}

// Global rate limiters
export const apiRateLimiter = new RateLimiter(20, 60000) // 20 requests per minute
export const saveRateLimiter = new RateLimiter(5, 30000) // 5 saves per 30 seconds
export const authRateLimiter = new RateLimiter(3, 300000) // 3 auth attempts per 5 minutes

// Audit logging
export interface AuditLog {
  action: string
  userId: string
  userName: string
  details: string
  timestamp: number
  ipAddress?: string
  userAgent?: string
}

export const createAuditLog = (
  action: string,
  userId: string,
  userName: string,
  details: string
): AuditLog => {
  return {
    action,
    userId,
    userName,
    details,
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  }
}

// Input validation
export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/
  return phoneRegex.test(phone)
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  if (password.length < 8) errors.push('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number')
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain a special character')
  return { valid: errors.length === 0, errors }
}

// XSS prevention
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Advanced sanitization using DOMPurify
export const sanitizeHtml = (html: string): string => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'title', 'target']
    })
  }
  return escapeHtml(html)
}

export const sanitizeOutput = (text: string): string => {
  return escapeHtml(text)
}

// Content Security Policy headers configuration
export const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.auth0.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.auth0.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// Input sanitization functions
export const sanitizeInput = {
  string: (input: string, maxLength: number = 1000): string => {
    return input.trim().substring(0, maxLength)
  },

  number: (input: string | number, min: number = -Infinity, max: number = Infinity): number => {
    const num = typeof input === 'string' ? parseFloat(input) : input
    return Math.min(Math.max(num, min), max)
  },

  email: (input: string): string => {
    return input.trim().toLowerCase().substring(0, 254)
  },

  url: (input: string): string => {
    const sanitized = input.trim().substring(0, 2048)
    return validateUrl(sanitized) ? sanitized : ''
  },

  html: (input: string): string => {
    return sanitizeHtml(input.trim())
  }
}

// Validate file upload
export const validateFile = (file: File, options: {
  allowedTypes?: string[]
  maxSizeMB?: number
}): { valid: boolean; error?: string } => {
  const { allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB = 5 } = options
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` }
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File too large. Max size: ${maxSizeMB}MB` }
  }
  
  return { valid: true }
}

// Session security
export const sessionSecurity = {
  generateSessionId: (): string => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  },

  isSessionExpired: (createdAt: number, maxAgeMs: number = 3600000): boolean => {
    return Date.now() - createdAt > maxAgeMs
  }
}

// Audit log storage
export const auditLogger = {
  logs: [] as AuditLog[],

  log: (action: string, userId: string, userName: string, details: string) => {
    const logEntry = createAuditLog(action, userId, userName, details)
    auditLogger.logs.push(logEntry)

    // Keep only last 1000 logs in memory
    if (auditLogger.logs.length > 1000) {
      auditLogger.logs = auditLogger.logs.slice(-1000)
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('bixfind_audit_logs', JSON.stringify(auditLogger.logs))
    }

    return logEntry
  },

  getLogs: (): AuditLog[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bixfind_audit_logs')
      if (stored) {
        auditLogger.logs = JSON.parse(stored)
      }
    }
    return auditLogger.logs
  },

  clearLogs: () => {
    auditLogger.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bixfind_audit_logs')
    }
  }
}