'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function MobileNav({ slug, navLinks, website, theme, template, density }: {
  slug: string
  navLinks: Array<{ id: string; label: string }>
  website: any
  theme: any
  template: any
  density: any
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className={`sticky top-0 z-50 ${template?.navStyle === 'glass' ? 'backdrop-blur-xl bg-white/70' : 'bg-white border-b'}`}>
        <div className={`max-w-6xl mx-auto flex items-center justify-between px-4 py-3`}>
          <Link href={`/p/${slug}`} className="flex items-center min-w-0">
            {website.logo_url ? (
              <img src={website.logo_url} alt={website.business_name || slug} className="h-8 w-auto max-w-[120px] object-contain rounded" />
            ) : (
              <span className="text-lg md:text-xl font-bold" style={{ color: theme.palette[0] }}>
                {(website.business_name || website.display_name || slug).charAt(0).toUpperCase()}
              </span>
            )}
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="text-gray-600 hover:text-gray-900 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Toggle menu">
            {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t bg-white px-4 pb-4">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border-b border-gray-50 last:border-0"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </>
  )
}
