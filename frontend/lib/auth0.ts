'use client'

import { useAuth0, Auth0Provider, withAuthenticationRequired, User } from '@auth0/auth0-react'
import React from 'react'

export { Auth0Provider, useAuth0, withAuthenticationRequired, User }

export const isAuth0Configured = () => {
  return !!process.env.NEXT_PUBLIC_AUTH0_DOMAIN && !!process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
}

export const auth0ProviderConfig = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? window.location.origin : ''
  }
}

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuth0Configured()) {
    return <>{children}</>
  }
  return (
    <Auth0Provider {...auth0ProviderConfig}>
      {children}
    </Auth0Provider>
  )
}

export const login = async () => {
  if (typeof window !== 'undefined') {
    const auth0 = await import('@auth0/auth0-react')
  }
}

export const logout = () => {
  if (typeof window !== 'undefined') {
    window.location.href = `https://${auth0ProviderConfig.domain}/v2/logout?client_id=${auth0ProviderConfig.clientId}&returnTo=${encodeURIComponent(window.location.origin)}`
  }
}

export interface AuthUser {
  userId?: string
  email?: string
  name?: string
  role?: string
}

export const syncUser = async (): Promise<AuthUser> => {
  return {}
}
