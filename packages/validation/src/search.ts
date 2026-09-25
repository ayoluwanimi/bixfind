import { z } from "zod"

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  category: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0).max(50000).default(10),
  minRating: z.coerce.number().min(0).max(5).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sort: z.enum(["relevance", "rating", "price_asc", "price_desc", "distance"]).default("relevance"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const ProviderCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  businessName: z.string(),
  primaryCategory: z.string(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  distance: z.number().optional(),
  thumbnailUrl: z.string().optional(),
  isVerified: z.boolean().default(false),
  badges: z.array(z.string()).default([]),
})

export const SearchResultSchema = z.object({
  items: z.array(ProviderCardSchema),
  nextCursor: z.string().optional(),
  aiSummary: z.string().optional(),
  facets: z.object({
    categories: z.array(z.object({ name: z.string(), count: z.number() })).optional(),
    ratings: z.array(z.object({ label: z.string(), count: z.number() })).optional(),
    priceRanges: z.array(z.object({ label: z.string(), count: z.number() })).optional(),
  }).optional(),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>
export type SearchResult = z.infer<typeof SearchResultSchema>
export type ProviderCard = z.infer<typeof ProviderCardSchema>
