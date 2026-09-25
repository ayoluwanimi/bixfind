'use client'

import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeProvider'

export function useProviderTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useProviderTheme must be used within a <ProviderThemeProvider>')
  }
  return context
}
