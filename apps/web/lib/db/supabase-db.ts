import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// The client is built on first use, NOT at import time. Constructing it at
// module scope made `next build` crash during "Collecting page data"
// ("supabaseUrl is required") whenever the build environment lacked the
// Supabase env vars — importing a route file must never throw. The error now
// surfaces only where it belongs: at first real database use, with a clear
// message about which variables are missing.
let client: SupabaseClient | null = null

function getDb(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — set them in this environment before using the database",
      )
    }
    client = createClient(url, key)
  }
  return client
}

// Lazy proxy keeps every existing `db.from(...)` / `db.rpc(...)` call site
// unchanged while deferring construction until the first property access.
export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property, _receiver) {
    const real = getDb() as unknown as Record<string | symbol, unknown>
    const value = real[property]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value
  },
})
