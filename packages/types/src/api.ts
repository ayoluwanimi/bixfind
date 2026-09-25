export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
}

export interface SearchParams extends PaginationParams {
  q?: string
  category?: string
  lat?: number
  lng?: number
  radius?: number
  tags?: string[]
}
