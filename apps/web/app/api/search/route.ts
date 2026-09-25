import { NextResponse } from "next/server"
import { SearchQuerySchema, type SearchResult, type ProviderCard } from "@bixfind/validation"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// ─── Fallback synonyms (used only when service_synonyms table is unavailable) ───
const FALLBACK_SYNONYMS: Record<string, string[]> = {
  barber: ["barbing", "haircut", "salon", "barbershop", "grooming", "shave", "fade", "hair", "makyan"],
  fashion: ["tailor", "sewing", "clothing", "dress", "boutique", "seamstress", "aso oke", "asoebi", "gele", "alaso", "riga", "kwalba"],
  food: ["catering", "chef", "cooking", "restaurant", "jollof", "small chops", "fried rice", "moi moi", "suya", "chop", "nri", "buka", "mama put"],
  plumbing: ["plumb", "pipe", "drain", "borehole", "gesy", "gyser", "omi", "ruwa"],
  electrical: ["electrician", "wiring", "inverter", "generator", "solar", "ac", "air conditioning", "cctv", "aaro", "ike", "iskanci"],
  cleaning: ["laundry", "wash", "dry clean", "housekeeping", "fumigation", "pest control", "wanka", "ogbugbu"],
  painting: ["painter", "wall", "pop ceiling", "pop", "plaster", "texture"],
  "car repair": ["mechanic", "panel beater", "vulcanize", "tokunbo", "jirgi", "ugboala"],
  "real estate": ["property", "house", "land", "rent", "apartment", "ile", "onile", "ulo", "dakin"],
  beauty: ["makeup", "skincare", "spa", "nails", "manicure", "pedicure", "lash", "omoge"],
  tech: ["computer", "laptop", "phone repair", "software", "web development", "graphic design", "oju riri", "ngwa"],
  education: ["tutor", "teaching", "lesson", "training", "course", "cram", "grinds", "akwukwo"],
  health: ["doctor", "pharmacy", "hospital", "nurse", "therapy", "lafiya", "ndu", "agbo", "osho"],
  legal: ["lawyer", "attorney", "CAC", "business registration", "cac"],
  finance: ["accountant", "tax", "bookkeeping", "POS", "pos", "chop money", "aje", "ogo"],
  events: ["party", "wedding", "owambe", "celebration", "event planner", "spray", "gbas gbos", "oge"],
  photography: ["camera", "photo", "video", "studio", "shoot", "nka"],
  entertainment: ["dj", "music", "band", "mc", "comedy", "egwu"],
  delivery: ["dispatch", "logistics", "courier", "transport", "waka", "abeg", "esan", "kaya", "okada", "danfo", "keke"],
  welding: ["weld", "fabrication", "metal work", "gate", "fence", "grill"],
  carpentry: ["carpenter", "furniture", "woodwork", "otobello", "igbo", "akpukpo", "rari"],
  construction: ["building", "masonry", "cement", "block", "ezzu", "okuta"],
  security: ["guard", "surveillance", "bouncer", "bodyguard", "omo se", "ole"],
  agriculture: ["farming", "poultry", "crop", "harvest", "gonaki", "taki", "ubi", "agbe"],
  printing: ["print", "photocopy", "business card", "flyer", "banner"],
  fitness: ["gym", "trainer", "workout", "yoga", "massage"],
  repair: ["maintenance", "handyman", "technician", "fix", "wahala", "bend down"],
  drinks: ["zobo", "kunu", "palm wine", "burukutu", "ogogoro", "gas"],
  shopping: ["market", "shop", "oja", "ahia", "kasuwa", "azuzi"],
  landscaping: ["garden", "lawn", "grass", "tree"],
  solar: ["solar panel", "solar battery", "renewable energy", "off grid"],
  consulting: ["consultant", "advice", "how far"],
  automobile: ["car dealer", "vehicle", "uk used", "usa used"],
  "interior design": ["interior", "decor", "renovation"],
  sports: ["football", "academy", "coaching"],
  pet: ["dog", "cat", "veterinary"],
  tiling: ["tile", "ceramic", "marble", "flooring"],
  roofing: ["roof", "ceiling", "zinc"],
  fencing: ["perimeter fence", "electric fence", "security fence"],
  glass: ["glazing", "mirror", "window"],
}

// ─── Intent classification for AI summary (kept separate from service synonyms) ───
const INTENT_KEYWORDS: Record<string, string[]> = {
  "Automotive & Vehicles": ["car", "auto", "vehicle", "motor", "dealership", "tokunbo", "automobile"],
  "Technology & IT": ["tech", "computer", "laptop", "phone", "software", "gadget", "repair"],
  "Home Services": ["plumbing", "pipe", "electrical", "painting", "cleaning", "carpentry"],
  "Beauty & Personal Care": ["hair", "salon", "beauty", "makeup", "skincare", "nails", "barber"],
  "Fashion & Clothing": ["fashion", "clothing", "dress", "tailor", "boutique", "shoes", "bags"],
  "Electronics Sales": ["electronics", "tv", "fridge", "generator", "inverter", "solar"],
  "Food & Catering": ["food", "catering", "cook", "chef", "restaurant", "meal"],
  "Education & Training": ["tutor", "teaching", "lesson", "class", "course", "training"],
  "Repair Services": ["repair", "fix", "maintenance", "handyman"],
  "Health & Medical": ["health", "medical", "doctor", "pharmacy", "therapy"],
}

function classifyIntent(query: string): string {
  const lower = query.toLowerCase()
  let bestCategory = "General"
  let bestScore = 0
  for (const [cat, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
  }
  return bestCategory
}

// ─── Expand query using service_synonyms table ───
async function expandQuery(admin: ReturnType<typeof createAdminClient>, query: string): Promise<string[]> {
  const queryLower = query.toLowerCase().trim()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)

  // 1. Try fetching from service_synonyms table
  try {
    const { data: bySynonym, error: err1 } = await admin
      .from("service_synonyms")
      .select("service_name")
      .in("synonym", queryWords)

    const { data: byServiceName, error: err2 } = await admin
      .from("service_synonyms")
      .select("service_name")
      .in("service_name", queryWords)

    if (!err1 && !err2) {
      // Collect all matching service_names
      const serviceNames = new Set<string>()
      if (bySynonym) bySynonym.forEach((r: any) => serviceNames.add(r.service_name))
      if (byServiceName) byServiceName.forEach((r: any) => serviceNames.add(r.service_name))

      if (serviceNames.size > 0) {
        // Fetch all synonyms for those service_names
        const { data: allSynonyms } = await admin
          .from("service_synonyms")
          .select("synonym")
          .in("service_name", Array.from(serviceNames))

        if (allSynonyms && allSynonyms.length > 0) {
          const expanded = new Set<string>(queryWords)
          allSynonyms.forEach((r: any) => expanded.add(r.synonym))
          serviceNames.forEach(name => expanded.add(name))
          return Array.from(expanded)
        }
      }
    }
  } catch {
    // Table may not exist — fall through to fallback
  }

  // 2. Fallback: use built-in synonym map
  const expanded = new Set<string>(queryWords)
  for (const word of queryWords) {
    if (FALLBACK_SYNONYMS[word]) {
      FALLBACK_SYNONYMS[word].forEach(s => expanded.add(s))
    }
    // Also check reverse: if word is a synonym value in any category
    for (const [service, synonyms] of Object.entries(FALLBACK_SYNONYMS)) {
      if (synonyms.includes(word) || synonyms.some(s => s.includes(word) || word.includes(s))) {
        expanded.add(service)
        synonyms.forEach(s => expanded.add(s))
      }
    }
  }
  return Array.from(expanded)
}

function generateAISummary(query: string, count: number): string {
  const category = classifyIntent(query)
  if (count === 0) {
    return `No results found for "${query}". Try different keywords or browse all categories.`
  }
  return `Found ${count} provider${count === 1 ? "" : "s"} in ${category} matching "${query}".`
}

function paginate<T extends { id?: string }>(items: T[], cursor?: string, limit: number = 20): { items: T[]; nextCursor?: string } {
  let start = 0
  if (cursor) {
    const cursorIndex = items.findIndex((item) => item.id === cursor)
    if (cursorIndex !== -1) start = cursorIndex + 1
  }
  const page = items.slice(start, start + limit)
  const nextCursor = start + limit < items.length ? page[page.length - 1]?.id : undefined
  return { items: page, nextCursor }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const raw: Record<string, string> = {}
    searchParams.forEach((v, k) => { raw[k] = v })

    const parsed = SearchQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { q, lat, lng, radiusKm, minRating, priceMin, priceMax, sort, cursor, limit, category } = parsed.data

    const admin = createAdminClient()

    // ─── Step 1: Expand query via service_synonyms ───
    const expandedTerms = await expandQuery(admin, q)

    // ─── Step 2: AI intent classification (for summary/category) ───
    const intentCategory = classifyIntent(q)
    const effectiveCategory = category || intentCategory

    // ─── Step 3: Search across providers + mini_websites + users ───
    let cards: ProviderCard[] = []

    // Build ILIKE conditions using expanded terms
    // Search: business_name, services JSON, mini_websites title/tagline/category/blocks
    const orConditions = expandedTerms
      .map(term => {
        const safe = encodeURIComponent(`%${term}%`)
        return `business_name.ilike.${safe}`
      })
      .join(",")

    // 3a: Search providers table — skip (mini_websites covers all with proper slugs)

    // 3b: Search mini_websites (published) — match on title, tagline, category, or blocks JSON
    try {
      const { data: sites } = await admin
        .from("mini_websites")
        .select("id, user_id, slug, title, tagline, category, blocks, is_published, logo_url")
        .eq("is_published", true)
        .limit(200)

      if (sites && sites.length > 0) {
        const matchingSites = sites.filter((site: any) => {
          const searchable = [
            site.title,
            site.tagline,
            site.category,
            typeof site.blocks === "string" ? site.blocks : JSON.stringify(site.blocks || ""),
          ].join(" ").toLowerCase()
          return expandedTerms.some(term => searchable.includes(term))
        })

        for (const site of matchingSites) {
          // Skip duplicates (already in cards from providers)
          if (cards.some(c => c.id === site.id || c.slug === site.slug)) continue

          // Parse blocks to extract service titles for better matching
          let serviceTitles = ""
          try {
            const blocks = typeof site.blocks === "string" ? JSON.parse(site.blocks) : site.blocks
            if (Array.isArray(blocks)) {
              for (const block of blocks) {
                if (block.sectionId === "services" && block.content?.services) {
                  serviceTitles = block.content.services
                    .map((s: any) => `${s.title || ""} ${s.description || ""}`)
                    .join(" ")
                }
              }
            }
          } catch {}

          // Extra relevance check: does any expanded term match the site's service titles?
          const serviceMatch = serviceTitles && expandedTerms.some(term => serviceTitles.toLowerCase().includes(term))
          if (!serviceTitles || serviceMatch) {
            cards.push({
              id: site.id,
              slug: site.slug || site.id,
              businessName: site.title || "Provider",
              primaryCategory: site.category || effectiveCategory || "General",
              rating: 0,
              reviewCount: 0,
              isVerified: false,
              badges: [],
              thumbnailUrl: site.logo_url || "",
            })
          }
        }
      }
    } catch {
      // Silent fallback
    }

    // 3c: Search users table (business_name / name)
    try {
      const userOrConditions = expandedTerms
        .map(term => {
          const safe = encodeURIComponent(`%${term}%`)
          return `name.ilike.${safe},kyc_business_name.ilike.${safe}`
        })
        .join(",")

      if (userOrConditions) {
        const { data: users } = await admin
          .from("users")
          .select("id, name, kyc_business_name, avatar_url")
          .or(userOrConditions)
          .limit(100)

        if (users && users.length > 0) {
          for (const u of users) {
            if (cards.some(c => c.id === u.id)) continue
            cards.push({
              id: u.id,
              slug: u.id,
              businessName: u.kyc_business_name || u.name || "Provider",
              primaryCategory: effectiveCategory || "General",
              rating: 0,
              reviewCount: 0,
              isVerified: false,
              badges: [],
              thumbnailUrl: u.avatar_url || "",
            })
          }
        }
      }
    } catch {
      // Silent fallback
    }

    // ─── Step 4: Deduplicate ───
    const seen = new Set<string>()
    cards = cards.filter(c => {
      const key = c.slug || c.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // ─── Step 5: Apply sorting ───
    if (sort === "rating") {
      cards.sort((a, b) => b.rating - a.rating)
    } else if (sort === "distance" && lat != null && lng != null) {
      cards.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    }

    // ─── Step 6: Pagination ───
    const { items, nextCursor: nc } = paginate(cards, cursor, limit)

    // ─── Step 7: Build facets ───
    const categoryCounts = new Map<string, number>()
    items.forEach((item) => {
      categoryCounts.set(item.primaryCategory, (categoryCounts.get(item.primaryCategory) || 0) + 1)
    })

    const result: SearchResult = {
      items,
      nextCursor: nc,
      aiSummary: generateAISummary(q, items.length),
      facets: {
        categories: Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count })),
        ratings: [
          { label: "4+", count: items.filter((i) => i.rating >= 4).length },
          { label: "3+", count: items.filter((i) => i.rating >= 3 && i.rating < 4).length },
          { label: "2+", count: items.filter((i) => i.rating >= 2 && i.rating < 3).length },
        ],
      },
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
        "CDN-Cache-Control": "public, max-age=30",
        "Surrogate-Control": "max-age=30",
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
