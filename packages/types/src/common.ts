export interface GeoLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
