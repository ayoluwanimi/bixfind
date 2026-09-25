import { z } from "zod"

export const SearchIntentSchema = z.object({
  searchText: z.string().describe("Normalized search query without filters"),
  category: z.string().nullable().describe("Inferred Bixfind category"),
  location: z.string().nullable().describe("Location mentioned in query"),
  urgency: z.enum(["low", "medium", "high", "urgent"]).nullable().describe("Detected urgency level"),
  maxPrice: z.number().nullable().describe("Maximum price in Naira inferred from query"),
  minRating: z.number().min(1).max(5).nullable().describe("Minimum rating filter"),
  currency: z.string().default("NGN"),
  modifiers: z.array(z.enum(["top_rated", "budget", "nearby", "available_now", "verified"])).describe("Search quality modifiers"),
})

export type SearchIntent = z.infer<typeof SearchIntentSchema>
