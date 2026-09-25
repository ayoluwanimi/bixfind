'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react'
import { storage } from '@/lib/storage'

interface NavLink {
  label: string
  href: string
  isActive?: boolean
}

interface AuthAwareNavProps {
  links?: NavLink[]
  theme?: 'light' | 'dark'
  showSignUp?: boolean
  currentPath?: string
}

function getDashboardLink(user: any): string {
  const type = user?.user_metadata?.user_type || user?.userType || 'customer'
  if (type === 'admin') return '/admin/overview'
  if (type === 'provider') return '/provider/today'
  return '/dashboard'
}

export default function AuthAwareNav({ links, theme = 'light', showSignUp = true, currentPath }: AuthAwareNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const activePath = currentPath || pathname
  const [user, setUser] = useState<any>(() => {
    const u = storage.getUser()
    const t = storage.getToken()
    return (u && t) ? u : null
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return activePath === '/'
    return activePath.startsWith(href)
  }

  const handleLogout = () => {
    storage.clearUser()
    storage.clearToken()
    setUser(null)
    router.push('/')
  }

  const defaultLinks: NavLink[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  const navLinks = links || defaultLinks

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-600'
  const activeTextColor = theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
  const logoColor = theme === 'dark' ? 'text-white' : 'text-blue-600'
  const bgColor = theme === 'dark' ? 'bg-transparent' : 'bg-white'
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-gray-200'

  return (
    <nav className={`${bgColor} ${borderColor} ${theme === 'dark' ? '' : 'border-b'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
          <span className={`text-2xl font-bold ${logoColor}`}>BIXFIND</span>
        </a>

        <div className={`hidden md:flex space-x-6 ${textColor}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${isActive(link.href) ? activeTextColor + ' font-semibold' : textColor} hover:opacity-80 transition`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href={getDashboardLink(user)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition text-sm font-medium"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className={`hidden md:block ${textColor} hover:opacity-80 transition`}>Sign In</Link>
              {showSignUp && (
                <Link href="/signup" className="hidden md:block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition text-sm">
                  Sign Up
                </Link>
              )}
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden ${bgColor} border-t shadow-lg`}>
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block ${isActive(link.href) ? activeTextColor + ' font-semibold' : textColor} hover:opacity-80 transition`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-200" />
            {user ? (
              <>
                <Link href={getDashboardLink(user)} onClick={() => setMobileMenuOpen(false)} className="block text-blue-600 font-semibold">
                  <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false) }} className="block text-red-500 font-semibold w-full text-left">
                  <LogOut className="w-4 h-4 inline mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-blue-600">Sign In</Link>
                {showSignUp && <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-blue-600 font-semibold">Sign Up</Link>}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
