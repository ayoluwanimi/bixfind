import { createAuth0Client, Auth0Client } from '@auth0/auth0-react'

let auth0Client: Auth0Client | null = null

const auth0Config = {
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
  redirectUri: typeof window !== 'undefined' ? window.location.origin : ''
}

let auth0Initialized = false

export const initAuth0 = async (): Promise<Auth0Client | null> => {
  if (typeof window === 'undefined' || !auth0Config.domain || !auth0Config.clientId) {
    console.warn('Auth0 not configured - set NEXT_PUBLIC_AUTH0_DOMAIN and NEXT_PUBLIC_AUTH0_CLIENT_ID')
    return null
  }

  try {
    auth0Client = await createAuth0Client({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      authorizationParams: {
        audience: auth0Config.audience,
        redirect_uri: auth0Config.redirectUri
      },
      cacheLocation: 'localstorage'
    })
    auth0Initialized = true
    console.log('Auth0 initialized successfully')
    return auth0Client
  } catch (e) {
    console.error('Auth0 initialization error:', e)
    return null
  }
}

export const getAuth0 = () => auth0Client
export const isAuth0Initialized = () => auth0Initialized

export interface Auth0User {
  email: string
  email_verified: boolean
  name: string
  nickname: string
  picture: string
  sub: string
}

export const login = async () => {
  if (!auth0Client) {
    console.warn('Auth0 not initialized')
    return false
  }
  try {
    await auth0Client.loginWithRedirect()
    return true
  } catch (e) {
    console.error('Auth0 login error:', e)
    return false
  }
}

export const logout = async () => {
  if (!auth0Client) {
    console.warn('Auth0 not initialized')
    return
  }
  try {
    await auth0Client.logout({
      logoutParams: {
        returnTo: typeof window !== 'undefined' ? window.location.origin : ''
      }
    })
  } catch (e) {
    console.error('Auth0 logout error:', e)
  }
}

export const getUser = async (): Promise<Auth0User | null> => {
  if (!auth0Client) return null
  try {
    const user = await auth0Client.getUser()
    return user as Auth0User | null
  } catch (e) {
    console.error('Auth0 getUser error:', e)
    return null
  }
}

export const getToken = async (): Promise<string | null> => {
  if (!auth0Client) return null
  try {
    const token = await auth0Client.getTokenSilently()
    return token
  } catch (e) {
    console.error('Auth0 getToken error:', e)
    return null
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  if (!auth0Client) return false
  try {
    return await auth0Client.isAuthenticated()
  } catch (e) {
    return false
  }
}

export const handleRedirectCallback = async () => {
  if (!auth0Client) return null
  try {
    const result = await auth0Client.handleRedirectWithAuth()
    return result
  } catch (e) {
    console.error('Auth0 handleRedirectCallback error:', e)
    return null
  }
}

export const syncUser = async (): Promise<{ userId?: string; email?: string; name?: string; role?: string }> => {
  const user = await getUser()
  if (!user) return {}

  const userId = user.sub

  return { userId, email: user.email, name: user.name }
}