import { Auth0Provider, withAuthenticationRequired, User } from '@auth0/auth0-react'
import React from 'react'

export { Auth0Provider, useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
export type { User } from '@auth0/auth0-react'

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

export interface AuthUser {
  userId?: string
  email?: string
  name?: string
  role?: string
}

export const syncUser = async (): Promise<AuthUser> => {
  return {}
}
