import { z } from "zod"

export const searchProvidersTool = {
  type: "function" as const,
  name: "searchProviders",
  description: "Search for service providers by category, location, price range, rating, and availability",
  parameters: z.object({
    category: z.string().optional().describe("Service category (e.g. Plumbing, Photography)"),
    location: z.string().optional().describe("City or area (e.g. Ikeja, Lagos)"),
    maxPrice: z.number().optional().describe("Maximum budget in Naira"),
    minRating: z.number().min(1).max(5).optional().describe("Minimum rating filter"),
    urgency: z.enum(["now", "today", "scheduled"]).optional().describe("How soon the service is needed"),
    query: z.string().optional().describe("Free-text search query"),
    limit: z.number().default(3).describe("Number of results to return (max 10)"),
  }),
}

export async function searchProviders(args: z.infer<typeof searchProvidersTool.parameters>) {
  const params = new URLSearchParams()
  if (args.category) params.set("category", args.category)
  if (args.location) params.set("location", args.location)
  if (args.maxPrice) params.set("priceMax", String(args.maxPrice))
  if (args.minRating) params.set("minRating", String(args.minRating))
  if (args.query) params.set("q", args.query)
  if (args.limit) params.set("limit", String(Math.min(args.limit, 10)))

  const res = await fetch(`/api/search?${params.toString()}`)
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`)
  return res.json()
}
