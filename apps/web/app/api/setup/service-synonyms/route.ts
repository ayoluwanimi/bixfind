import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const SEED_DATA: Array<{ service_name: string; synonym: string; language: string }> = [
  // === Barber / Hair Salon ===
  { service_name: "barber", synonym: "barbing", language: "en" },
  { service_name: "barber", synonym: "haircut", language: "en" },
  { service_name: "barber", synonym: "salon", language: "en" },
  { service_name: "barber", synonym: "barbershop", language: "en" },
  { service_name: "barber", synonym: "grooming", language: "en" },
  { service_name: "barber", synonym: "shave", language: "en" },
  { service_name: "barber", synonym: "fade", language: "en" },
  { service_name: "barber", synonym: "hair", language: "en" },
  { service_name: "barber", synonym: "makyan", language: "ha" },

  // === Fashion / Tailoring ===
  { service_name: "fashion", synonym: "tailor", language: "en" },
  { service_name: "fashion", synonym: "sewing", language: "en" },
  { service_name: "fashion", synonym: "clothing", language: "en" },
  { service_name: "fashion", synonym: "dress", language: "en" },
  { service_name: "fashion", synonym: "boutique", language: "en" },
  { service_name: "fashion", synonym: "seamstress", language: "en" },
  { service_name: "fashion", synonym: "aso oke", language: "yo" },
  { service_name: "fashion", synonym: "asoebi", language: "yo" },
  { service_name: "fashion", synonym: "gele", language: "yo" },
  { service_name: "fashion", synonym: "alaso", language: "yo" },
  { service_name: "fashion", synonym: "riga", language: "ha" },
  { service_name: "fashion", synonym: "kwalba", language: "ha" },
  { service_name: "fashion", synonym: "hula", language: "ha" },
  { service_name: "fashion", synonym: "zare", language: "ha" },
  { service_name: "fashion", synonym: "abaya", language: "yo" },
  { service_name: "fashion", synonym: "sị", language: "ig" },
  { service_name: "fashion", synonym: "akpa", language: "ig" },

  // === Food / Catering ===
  { service_name: "food", synonym: "catering", language: "en" },
  { service_name: "food", synonym: "chef", language: "en" },
  { service_name: "food", synonym: "cooking", language: "en" },
  { service_name: "food", synonym: "restaurant", language: "en" },
  { service_name: "food", synonym: "jollof", language: "en" },
  { service_name: "food", synonym: "small chops", language: "en" },
  { service_name: "food", synonym: "fried rice", language: "en" },
  { service_name: "food", synonym: "moi moi", language: "en" },
  { service_name: "food", synonym: "pepper soup", language: "en" },
  { service_name: "food", synonym: "suya", language: "en" },
  { service_name: "food", synonym: "puff puff", language: "en" },
  { service_name: "food", synonym: "banga", language: "en" },
  { service_name: "food", synonym: "efo riro", language: "en" },
  { service_name: "food", synonym: "amala", language: "en" },
  { service_name: "food", synonym: "eba", language: "en" },
  { service_name: "food", synonym: "fufu", language: "en" },
  { service_name: "food", synonym: "pounded yam", language: "en" },
  { service_name: "food", synonym: "boli", language: "en" },
  { service_name: "food", synonym: "bole", language: "en" },
  { service_name: "food", synonym: "roasted corn", language: "en" },
  { service_name: "food", synonym: "buka", language: "yo" },
  { service_name: "food", synonym: "mama put", language: "en" },
  { service_name: "food", synonym: "chop", language: "pcm" },
  { service_name: "food", synonym: "nri", language: "ig" },
  { service_name: "food", synonym: "eja", language: "yo" },
  { service_name: "food", synonym: "kilishi", language: "ha" },
  { service_name: "food", synonym: "fura da nono", language: "ha" },
  { service_name: "food", synonym: "dawa", language: "ha" },
  { service_name: "food", synonym: "ina", language: "yo" },

  // === Plumbing ===
  { service_name: "plumbing", synonym: "plumb", language: "en" },
  { service_name: "plumbing", synonym: "pipe", language: "en" },
  { service_name: "plumbing", synonym: "drain", language: "en" },
  { service_name: "plumbing", synonym: "leak", language: "en" },
  { service_name: "plumbing", synonym: "borehole", language: "en" },
  { service_name: "plumbing", synonym: "borehole drilling", language: "en" },
  { service_name: "plumbing", synonym: "water supply", language: "en" },
  { service_name: "plumbing", synonym: "gesy", language: "en" },
  { service_name: "plumbing", synonym: "gyser", language: "en" },
  { service_name: "plumbing", synonym: "omi", language: "yo" },
  { service_name: "plumbing", synonym: "ruwa", language: "ha" },
  { service_name: "plumbing", synonym: "bend down", language: "pcm" },

  // === Electrical ===
  { service_name: "electrical", synonym: "electrician", language: "en" },
  { service_name: "electrical", synonym: "wiring", language: "en" },
  { service_name: "electrical", synonym: "inverter", language: "en" },
  { service_name: "electrical", synonym: "generator", language: "en" },
  { service_name: "electrical", synonym: "solar", language: "en" },
  { service_name: "electrical", synonym: "ac", language: "en" },
  { service_name: "electrical", synonym: "air conditioning", language: "en" },
  { service_name: "electrical", synonym: "cctv", language: "en" },
  { service_name: "electrical", synonym: "light", language: "en" },
  { service_name: "electrical", synonym: "power", language: "en" },
  { service_name: "electrical", synonym: "aaro", language: "yo" },
  { service_name: "electrical", synonym: "ike", language: "ig" },
  { service_name: "electrical", synonym: "iskanci", language: "ha" },
  { service_name: "electrical", synonym: "inji", language: "ha" },

  // === Cleaning ===
  { service_name: "cleaning", synonym: "laundry", language: "en" },
  { service_name: "cleaning", synonym: "wash", language: "en" },
  { service_name: "cleaning", synonym: "dry clean", language: "en" },
  { service_name: "cleaning", synonym: "housekeeping", language: "en" },
  { service_name: "cleaning", synonym: "fumigation", language: "en" },
  { service_name: "cleaning", synonym: "pest control", language: "en" },
  { service_name: "cleaning", synonym: "wanka", language: "ha" },
  { service_name: "cleaning", synonym: "ogbugbu", language: "ig" },
  { service_name: "cleaning", synonym: "no wahala", language: "pcm" },

  // === Painting ===
  { service_name: "painting", synonym: "painter", language: "en" },
  { service_name: "painting", synonym: "wall", language: "en" },
  { service_name: "painting", synonym: "pop ceiling", language: "en" },
  { service_name: "painting", synonym: "pop", language: "en" },
  { service_name: "painting", synonym: "plaster", language: "en" },
  { service_name: "painting", synonym: "texture", language: "en" },

  // === Car Repairs ===
  { service_name: "car repair", synonym: "mechanic", language: "en" },
  { service_name: "car repair", synonym: "panel beater", language: "pcm" },
  { service_name: "car repair", synonym: "vulcanize", language: "pcm" },
  { service_name: "car repair", synonym: "tokunbo", language: "yo" },
  { service_name: "car repair", synonym: "tokunboh", language: "yo" },
  { service_name: "car repair", synonym: "fairly used", language: "en" },
  { service_name: "car repair", synonym: "jirgi", language: "ha" },
  { service_name: "car repair", synonym: "ugboala", language: "ig" },

  // === Real Estate ===
  { service_name: "real estate", synonym: "property", language: "en" },
  { service_name: "real estate", synonym: "house", language: "en" },
  { service_name: "real estate", synonym: "land", language: "en" },
  { service_name: "real estate", synonym: "rent", language: "en" },
  { service_name: "real estate", synonym: "apartment", language: "en" },
  { service_name: "real estate", synonym: "ile", language: "yo" },
  { service_name: "real estate", synonym: "onile", language: "yo" },
  { service_name: "real estate", synonym: "omo onile", language: "yo" },
  { service_name: "real estate", synonym: "ulo", language: "ig" },
  { service_name: "real estate", synonym: "dakin", language: "ha" },

  // === Beauty ===
  { service_name: "beauty", synonym: "makeup", language: "en" },
  { service_name: "beauty", synonym: "skincare", language: "en" },
  { service_name: "beauty", synonym: "spa", language: "en" },
  { service_name: "beauty", synonym: "nails", language: "en" },
  { service_name: "beauty", synonym: "manicure", language: "en" },
  { service_name: "beauty", synonym: "pedicure", language: "en" },
  { service_name: "beauty", synonym: "lash", language: "en" },
  { service_name: "beauty", synonym: "omoge", language: "yo" },
  { service_name: "beauty", synonym: "mkpọsa", language: "ig" },

  // === Tech / IT ===
  { service_name: "tech", synonym: "computer", language: "en" },
  { service_name: "tech", synonym: "laptop", language: "en" },
  { service_name: "tech", synonym: "phone repair", language: "en" },
  { service_name: "tech", synonym: "software", language: "en" },
  { service_name: "tech", synonym: "web development", language: "en" },
  { service_name: "tech", synonym: "graphic design", language: "en" },
  { service_name: "tech", synonym: "oju riri", language: "yo" },
  { service_name: "tech", synonym: "ngwa", language: "ig" },

  // === Education ===
  { service_name: "education", synonym: "tutor", language: "en" },
  { service_name: "education", synonym: "teaching", language: "en" },
  { service_name: "education", synonym: "lesson", language: "en" },
  { service_name: "education", synonym: "training", language: "en" },
  { service_name: "education", synonym: "course", language: "en" },
  { service_name: "education", synonym: "cram", language: "pcm" },
  { service_name: "education", synonym: "grinds", language: "pcm" },
  { service_name: "education", synonym: "akwukwo", language: "ig" },

  // === Health ===
  { service_name: "health", synonym: "doctor", language: "en" },
  { service_name: "health", synonym: "pharmacy", language: "en" },
  { service_name: "health", synonym: "hospital", language: "en" },
  { service_name: "health", synonym: "nurse", language: "en" },
  { service_name: "health", synonym: "therapy", language: "en" },
  { service_name: "health", synonym: "lafiya", language: "ha" },
  { service_name: "health", synonym: "ndu", language: "ig" },
  { service_name: "health", synonym: "agbo", language: "yo" },
  { service_name: "health", synonym: "osho", language: "yo" },

  // === Legal ===
  { service_name: "legal", synonym: "lawyer", language: "en" },
  { service_name: "legal", synonym: "attorney", language: "en" },
  { service_name: "legal", synonym: "CAC", language: "en" },
  { service_name: "legal", synonym: "business registration", language: "en" },
  { service_name: "legal", synonym: "cac", language: "en" },

  // === Finance ===
  { service_name: "finance", synonym: "accountant", language: "en" },
  { service_name: "finance", synonym: "tax", language: "en" },
  { service_name: "finance", synonym: "bookkeeping", language: "en" },
  { service_name: "finance", synonym: "POS", language: "en" },
  { service_name: "finance", synonym: "pos", language: "en" },
  { service_name: "finance", synonym: "chop money", language: "pcm" },
  { service_name: "finance", synonym: "aje", language: "yo" },
  { service_name: "finance", synonym: "ogo", language: "ig" },

  // === Events ===
  { service_name: "events", synonym: "party", language: "en" },
  { service_name: "events", synonym: "wedding", language: "en" },
  { service_name: "events", synonym: "owambe", language: "yo" },
  { service_name: "events", synonym: "celebration", language: "en" },
  { service_name: "events", synonym: "event planner", language: "en" },
  { service_name: "events", synonym: "spray", language: "pcm" },
  { service_name: "events", synonym: "gbas gbos", language: "pcm" },
  { service_name: "events", synonym: "oge", language: "ig" },
  { service_name: "events", synonym: "agbero", language: "pcm" },

  // === Photography ===
  { service_name: "photography", synonym: "camera", language: "en" },
  { service_name: "photography", synonym: "photo", language: "en" },
  { service_name: "photography", synonym: "video", language: "en" },
  { service_name: "photography", synonym: "studio", language: "en" },
  { service_name: "photography", synonym: "shoot", language: "en" },
  { service_name: "photography", synonym: "nka", language: "ig" },

  // === Music / Entertainment ===
  { service_name: "entertainment", synonym: "dj", language: "en" },
  { service_name: "entertainment", synonym: "music", language: "en" },
  { service_name: "entertainment", synonym: "band", language: "en" },
  { service_name: "entertainment", synonym: "mc", language: "en" },
  { service_name: "entertainment", synonym: "comedy", language: "en" },
  { service_name: "entertainment", synonym: "egwu", language: "ig" },

  // === Delivery / Logistics ===
  { service_name: "delivery", synonym: "dispatch", language: "en" },
  { service_name: "delivery", synonym: "logistics", language: "en" },
  { service_name: "delivery", synonym: "courier", language: "en" },
  { service_name: "delivery", synonym: "transport", language: "en" },
  { service_name: "delivery", synonym: "waka", language: "pcm" },
  { service_name: "delivery", synonym: "abeg", language: "pcm" },
  { service_name: "delivery", synonym: "esan", language: "yo" },
  { service_name: "delivery", synonym: "uzu", language: "ig" },
  { service_name: "delivery", synonym: "kaya", language: "ha" },
  { service_name: "delivery", synonym: "okada", language: "pcm" },
  { service_name: "delivery", synonym: "danfo", language: "pcm" },
  { service_name: "delivery", synonym: "keke", language: "pcm" },
  { service_name: "delivery", synonym: "basin", language: "ha" },

  // === Welding / Fabrication ===
  { service_name: "welding", synonym: "weld", language: "en" },
  { service_name: "welding", synonym: "fabrication", language: "en" },
  { service_name: "welding", synonym: "metal work", language: "en" },
  { service_name: "welding", synonym: "gate", language: "en" },
  { service_name: "welding", synonym: "fence", language: "en" },
  { service_name: "welding", synonym: "grill", language: "en" },

  // === Carpentry / Furniture ===
  { service_name: "carpentry", synonym: "carpenter", language: "en" },
  { service_name: "carpentry", synonym: "furniture", language: "en" },
  { service_name: "carpentry", synonym: "woodwork", language: "en" },
  { service_name: "carpentry", synonym: "otobello", language: "ha" },
  { service_name: "carpentry", synonym: "igbo", language: "yo" },
  { service_name: "carpentry", synonym: "akpukpo", language: "ig" },
  { service_name: "carpentry", synonym: "rari", language: "ha" },

  // === Construction / Building ===
  { service_name: "construction", synonym: "building", language: "en" },
  { service_name: "construction", synonym: "masonry", language: "en" },
  { service_name: "construction", synonym: "cement", language: "en" },
  { service_name: "construction", synonym: "block", language: "en" },
  { service_name: "construction", synonym: "ezzu", language: "ig" },
  { service_name: "construction", synonym: "okuta", language: "yo" },

  // === Security ===
  { service_name: "security", synonym: "guard", language: "en" },
  { service_name: "security", synonym: "surveillance", language: "en" },
  { service_name: "security", synonym: "bouncer", language: "en" },
  { service_name: "security", synonym: "bodyguard", language: "en" },
  { service_name: "security", synonym: "omo se", language: "pcm" },
  { service_name: "security", synonym: "ole", language: "yo" },

  // === Agriculture ===
  { service_name: "agriculture", synonym: "farming", language: "en" },
  { service_name: "agriculture", synonym: "poultry", language: "en" },
  { service_name: "agriculture", synonym: "crop", language: "en" },
  { service_name: "agriculture", synonym: "harvest", language: "en" },
  { service_name: "agriculture", synonym: "gonaki", language: "ha" },
  { service_name: "agriculture", synonym: "taki", language: "ha" },
  { service_name: "agriculture", synonym: "ubi", language: "ig" },
  { service_name: "agriculture", synonym: "agbe", language: "yo" },

  // === Printing ===
  { service_name: "printing", synonym: "print", language: "en" },
  { service_name: "printing", synonym: "photocopy", language: "en" },
  { service_name: "printing", synonym: "business card", language: "en" },
  { service_name: "printing", synonym: "flyer", language: "en" },
  { service_name: "printing", synonym: "banner", language: "en" },

  // === Fitness ===
  { service_name: "fitness", synonym: "gym", language: "en" },
  { service_name: "fitness", synonym: "trainer", language: "en" },
  { service_name: "fitness", synonym: "workout", language: "en" },
  { service_name: "fitness", synonym: "yoga", language: "en" },
  { service_name: "fitness", synonym: "massage", language: "en" },

  // === Repair ===
  { service_name: "repair", synonym: "maintenance", language: "en" },
  { service_name: "repair", synonym: "handyman", language: "en" },
  { service_name: "repair", synonym: "technician", language: "en" },
  { service_name: "repair", synonym: "fix", language: "en" },
  { service_name: "repair", synonym: "wahala", language: "pcm" },
  { service_name: "repair", synonym: "bend down", language: "pcm" },

  // === Drinks / Beverages ===
  { service_name: "drinks", synonym: "zobo", language: "en" },
  { service_name: "drinks", synonym: "kunu", language: "ha" },
  { service_name: "drinks", synonym: "palm wine", language: "en" },
  { service_name: "drinks", synonym: "burukutu", language: "pcm" },
  { service_name: "drinks", synonym: "ogogoro", language: "pcm" },
  { service_name: "drinks", synonym: "gas", language: "ha" },

  // === Shopping / Commerce ===
  { service_name: "shopping", synonym: "market", language: "en" },
  { service_name: "shopping", synonym: "shop", language: "en" },
  { service_name: "shopping", synonym: "oja", language: "yo" },
  { service_name: "shopping", synonym: "ahia", language: "ig" },
  { service_name: "shopping", synonym: "kasuwa", language: "ha" },
  { service_name: "shopping", synonym: "azuzi", language: "ig" },

  // === Landscaping / Gardening ===
  { service_name: "landscaping", synonym: "garden", language: "en" },
  { service_name: "landscaping", synonym: "lawn", language: "en" },
  { service_name: "landscaping", synonym: "grass", language: "en" },
  { service_name: "landscaping", synonym: "tree", language: "en" },

  // === Glass / Windows ===
  { service_name: "glass", synonym: "glazing", language: "en" },
  { service_name: "glass", synonym: "mirror", language: "en" },
  { service_name: "glass", synonym: "window", language: "en" },

  // === Roofing ===
  { service_name: "roofing", synonym: "roof", language: "en" },
  { service_name: "roofing", synonym: "ceiling", language: "en" },
  { service_name: "roofing", synonym: "zinc", language: "en" },

  // === Tiling / Flooring ===
  { service_name: "tiling", synonym: "tile", language: "en" },
  { service_name: "tiling", synonym: "ceramic", language: "en" },
  { service_name: "tiling", synonym: "marble", language: "en" },
  { service_name: "tiling", synonym: "flooring", language: "en" },

  // === Fencing ===
  { service_name: "fencing", synonym: "perimeter fence", language: "en" },
  { service_name: "fencing", synonym: "electric fence", language: "en" },
  { service_name: "fencing", synonym: "security fence", language: "en" },

  // === Solar / Energy ===
  { service_name: "solar", synonym: "solar panel", language: "en" },
  { service_name: "solar", synonym: "solar battery", language: "en" },
  { service_name: "solar", synonym: "renewable energy", language: "en" },
  { service_name: "solar", synonym: "off grid", language: "en" },

  // === Consultation ===
  { service_name: "consulting", synonym: "consultant", language: "en" },
  { service_name: "consulting", synonym: "advice", language: "en" },
  { service_name: "consulting", synonym: "how far", language: "pcm" },

  // === Pet ===
  { service_name: "pet", synonym: "dog", language: "en" },
  { service_name: "pet", synonym: "cat", language: "en" },
  { service_name: "pet", synonym: "veterinary", language: "en" },

  // === Automobile (sales) ===
  { service_name: "automobile", synonym: "car dealer", language: "en" },
  { service_name: "automobile", synonym: "vehicle", language: "en" },
  { service_name: "automobile", synonym: "uk used", language: "en" },
  { service_name: "automobile", synonym: "usa used", language: "en" },

  // === Interior Design ===
  { service_name: "interior design", synonym: "interior", language: "en" },
  { service_name: "interior design", synonym: "decor", language: "en" },
  { service_name: "interior design", synonym: "renovation", language: "en" },

  // === Sports ===
  { service_name: "sports", synonym: "football", language: "en" },
  { service_name: "sports", synonym: "academy", language: "en" },
  { service_name: "sports", synonym: "coaching", language: "en" },
]

export async function POST() {
  try {
    const admin = createAdminClient()

    // Step 1: Create table via raw SQL (Supabase JS doesn't support DDL, so use RPC)
    // Try to check if table exists first by querying it
    const { error: checkError } = await admin.from("service_synonyms").select("id").limit(1)

    if (checkError && checkError.message?.includes("does not exist")) {
      // Table doesn't exist — we can't create it via the JS client.
      // Return instructions for manual creation.
      return NextResponse.json({
        status: "table_missing",
        message: "service_synonyms table does not exist. Run the SQL migration first.",
        sql: `CREATE TABLE service_synonyms (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          service_name TEXT NOT NULL,
          synonym TEXT NOT NULL,
          language TEXT NOT NULL DEFAULT 'en',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX idx_service_synonyms_pair ON service_synonyms (LOWER(service_name), LOWER(synonym));
        CREATE INDEX idx_service_synonyms_service ON service_synonyms (LOWER(service_name));
        CREATE INDEX idx_service_synonyms_synonym ON service_synonyms (LOWER(synonym));
        ALTER TABLE service_synonyms ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Public read" ON service_synonyms FOR SELECT USING (true);
        CREATE POLICY "Service role all" ON service_synonyms FOR ALL USING (auth.role() = 'service_role');`
      })
    }

    // Step 2: Upsert seed data in batches
    const batchSize = 100
    let inserted = 0
    for (let i = 0; i < SEED_DATA.length; i += batchSize) {
      const batch = SEED_DATA.slice(i, i + batchSize).map(row => ({
        service_name: row.service_name.toLowerCase(),
        synonym: row.synonym.toLowerCase(),
        language: row.language,
      }))

      const { error } = await admin
        .from("service_synonyms")
        .upsert(batch, { onConflict: "service_name,synonym", ignoreDuplicates: false })

      if (error) {
        console.error("Seed batch error:", error)
      } else {
        inserted += batch.length
      }
    }

    // Step 3: Count total
    const { count } = await admin
      .from("service_synonyms")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      status: "ok",
      inserted,
      total: count,
      message: `Seeded ${inserted} service synonyms. Total in table: ${count}`,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Setup failed" }, { status: 500 })
  }
}
