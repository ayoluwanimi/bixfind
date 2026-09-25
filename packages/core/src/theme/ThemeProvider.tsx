'use client'

import { createContext, useMemo, type ReactNode } from 'react'
import { getProviderTheme, type ProviderTheme, type MiniWebsiteData } from './getProviderTheme'

export interface ThemeContextValue {
  theme: ProviderTheme
  website: MiniWebsiteData | null
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ProviderThemeProvider({
  children,
  website,
}: {
  children: ReactNode
  website?: MiniWebsiteData | null
}) {
  const theme = useMemo(() => getProviderTheme(website), [website])

  const value = useMemo(() => ({ theme, website: website ?? null }), [theme, website])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
