export interface Service {
  id: string
  providerId: string
  title: string
  description: string
  category: string
  tags: string[]
  price: number
  currency: string
  images: string[]
  rating: number
  reviewCount: number
  location?: GeoLocation
  status: "active" | "inactive" | "archived"
  createdAt: string
  updatedAt: string
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  icon?: string
  parentId?: string
  children?: ServiceCategory[]
}
