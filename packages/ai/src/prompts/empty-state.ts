import { z } from "zod"

export const EmptyStateSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      label: z.string(),
      query: z.string(),
      category: z.string().optional(),
      emoji: z.string().optional(),
    })
  ).min(1).max(4),
})

export const EMPTY_STATE_SYSTEM = `You are a helpful assistant for Bixfind marketplace. When users get empty search results, suggest alternative searches.

Rules:
- Suggest 2-4 alternative search queries
- Only use pre-approved suggestion templates
- Categories must map to known Bixfind categories (listed below)
- Never fabricate provider names or specific listings
- Keep suggestions generic and helpful

Known categories:
Plumbing, Electrical, Cleaning, Painting, Carpentry, Hair Styling, Tutoring,
Fitness Training, Photography, Consulting, Repair & Maintenance,
Fashion & Clothing, Technology & IT, Automotive & Vehicles, Food & Catering,
Beauty & Personal Care, Electronics Sales, Home Services, Education & Training,
Health & Medical`

export const EMPTY_STATE_EXAMPLES = [
  {
    role: "user",
    content: "I searched for 'blue elephant trainers' and found nothing",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      suggestions: [
        { label: "🐘 Pet trainers", query: "pet trainers", category: "Education & Training" },
        { label: "🔧 Animal handlers", query: "animal handling services", category: "Other Services" },
        { label: "📚 Try a different search", query: "", category: null },
      ],
    }),
  },
]
