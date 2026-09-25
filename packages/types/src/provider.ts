export interface Provider {
  id: string
  userId: string
  businessName: string
  description: string
  logo?: string
  coverImage?: string
  servicesCount: number
  rating: number
  reviewCount: number
  location?: GeoLocation
  verified: boolean
  contactEmail?: string
  contactPhone?: string
  website?: string
  socialLinks?: Record<string, string>
  workingHours?: WorkingHours
  createdAt: string
  updatedAt: string
}

export interface WorkingHours {
  monday?: TimeRange
  tuesday?: TimeRange
  wednesday?: TimeRange
  thursday?: TimeRange
  friday?: TimeRange
  saturday?: TimeRange
  sunday?: TimeRange
}

export interface TimeRange {
  open: string
  close: string
}
