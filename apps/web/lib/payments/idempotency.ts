import { db } from "@/lib/db/supabase-db"

export function generateIdempotencyKey(entityType: string, entityId: string, operation: string): string {
  return `${entityType}_${entityId}_${operation}_${Date.now()}`
}

export function generateStableIdempotencyKey(entityType: string, entityId: string, operation: string): string {
  return `${entityType}_${entityId}_${operation}`
}

export async function checkIdempotency(key: string): Promise<Record<string, unknown> | null> {
  const { data } = await db.from("idempotency_keys").select("response").eq("key", key).single()
  if (!data) return null
  return data.response as Record<string, unknown>
}

export async function saveIdempotency(key: string, response: Record<string, unknown>, ttlMs = 86_400_000): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString()
  await db.from("idempotency_keys").upsert({ key, response, expires_at: expiresAt }, { onConflict: "key" })
}

export async function withIdempotency<T extends Record<string, unknown>>(
  entityType: string,
  entityId: string,
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = generateStableIdempotencyKey(entityType, entityId, operation)
  const existing = await checkIdempotency(key)
  if (existing) return existing as T
  const result = await fn()
  await saveIdempotency(key, result)
  return result
}
