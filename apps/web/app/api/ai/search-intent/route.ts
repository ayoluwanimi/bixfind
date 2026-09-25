import { NextRequest, NextResponse } from "next/server"
import { openai, DEFAULT_MODELS, SearchIntentSchema, analyzePrompt } from "@bixfind/ai"

export async function POST(request: NextRequest) {
  let searchQuery: string = ""
  try {
    const { query } = await request.json()
    searchQuery = query || ""

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const { safe, stripped } = analyzePrompt(query)
    const searchTerm = safe ? query : stripped

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODELS.fast,
      messages: [
        {
          role: "system",
          content: `You are a search intent classifier for Bixfind marketplace. Extract structured filters from free-text search queries. 
Output ONLY valid JSON matching this schema:
{
  "searchText": "normalized query without filters",
  "category": "inferred category or null",
  "location": "city/area or null",
  "urgency": "low|medium|high|urgent or null",
  "maxPrice": number or null,
  "minRating": number (1-5) or null,
  "currency": "NGN",
  "modifiers": ["top_rated"|"budget"|"nearby"|"available_now"|"verified"]
}

Categories: Plumbing, Electrical, Cleaning, Painting, Carpentry, Hair Styling, 
Tutoring, Fitness Training, Photography, Consulting, Repair & Maintenance, 
Fashion & Clothing, Technology & IT, Automotive & Vehicles, Food & Catering, 
Beauty & Personal Care, Electronics Sales, Home Services, Education & Training, Health & Medical

Nigerian prices are in ₦ (Naira). "k" means thousand. E.g. "₦15k" = 15000.`,
        },
        { role: "user", content: searchTerm },
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0]?.message?.content || "{}"

    let parsed
    try {
      parsed = SearchIntentSchema.parse(JSON.parse(raw))
    } catch {
      parsed = SearchIntentSchema.parse({
        searchText: query,
        category: null,
        location: null,
        urgency: null,
        maxPrice: null,
        minRating: null,
        currency: "NGN",
        modifiers: [],
      })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("[Search Intent] Error:", error)
    return NextResponse.json(
      { searchText: searchQuery, category: null, location: null, urgency: null, maxPrice: null, minRating: null, currency: "NGN", modifiers: [] },
      { status: 200 },
    )
  }
}
