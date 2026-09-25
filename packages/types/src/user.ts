export interface User {
  id: string
  email: string
  name: string
  role: "customer" | "provider" | "admin"
  avatar?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  bio?: string
  location?: GeoLocation
  servicesCount?: number
  rating?: number
}
