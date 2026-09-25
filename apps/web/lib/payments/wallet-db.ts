import { db } from "@/lib/db/supabase-db"
import { EntryType, formatWalletEntry, computeBalanceChange } from "@bixfind/core"
import type { Kobo, WalletEntry, WalletSummary } from "@bixfind/core"

export async function getWallet(profileId: string) {
  const { data, error } = await db.from("wallets").select("*").eq("profile_id", profileId).single()
  if (error || !data) throw new Error("Wallet not found")
  return data
}

export async function getWalletSummary(profileId: string): Promise<WalletSummary> {
  const wallet = await getWallet(profileId)
  return {
    balance: Math.round(Number(wallet.balance) * 100) as Kobo,
    pending: Math.round(Number(wallet.balance_hold) * 100) as Kobo,
    available: Math.round((Number(wallet.balance) - Number(wallet.balance_hold)) * 100) as Kobo,
    currency: wallet.currency,
  }
}

export async function createWalletEntry(params: {
  walletId: string
  profileId: string
  entryType: EntryType
  amount: Kobo
  referenceType?: string
  referenceId?: string
  description?: string
  metadata?: Record<string, unknown>
}): Promise<WalletEntry> {
  const { data: wallet, error: wErr } = await db.from("wallets").select("*").eq("id", params.walletId).single()
  if (wErr || !wallet) throw new Error("Wallet not found")

  const { balanceDelta, holdDelta } = computeBalanceChange(params.entryType, params.amount)
  const currentBalance = Number(wallet.balance)
  const currentHold = Number(wallet.balance_hold)

  const newBalance = currentBalance + balanceDelta
  const newHold = currentHold + holdDelta

  const { data: entry, error: eErr } = await db.from("wallet_entries").insert({
    wallet_id: params.walletId,
    profile_id: params.profileId,
    entry_type: params.entryType,
    amount: balanceDelta,
    balance_before: currentBalance,
    balance_after: newBalance,
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    description: params.description,
    metadata: params.metadata ?? {},
  }).select().single()

  if (eErr) throw new Error(`Failed to create wallet entry: ${eErr.message}`)

  await db.from("wallets").update({ balance: newBalance, balance_hold: newHold }).eq("id", params.walletId)

  return formatWalletEntry(entry)
}

export async function getWalletEntries(params: {
  profileId: string
  limit?: number
  cursor?: string
}): Promise<{ entries: WalletEntry[]; nextCursor?: string }> {
  const limit = params.limit ?? 20

  let query = db
    .from("wallet_entries")
    .select("*")
    .eq("profile_id", params.profileId)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (params.cursor) {
    const { data: cursorEntry } = await db.from("wallet_entries").select("created_at").eq("id", params.cursor).single()
    if (cursorEntry) {
      query = query.lt("created_at", cursorEntry.created_at)
    }
  }

  const { data: entries } = await query
  if (!entries) return { entries: [] }

  const hasMore = entries.length > limit
  const sliced = hasMore ? entries.slice(0, limit) : entries

  return {
    entries: sliced.map(formatWalletEntry),
    nextCursor: hasMore ? sliced[sliced.length - 1].id : undefined,
  }
}

export async function ensureWallet(profileId: string) {
  const { data: existing } = await db.from("wallets").select("*").eq("profile_id", profileId).single()
  if (existing) return existing

  const { data, error } = await db.from("wallets").insert({ profile_id: profileId }).select().single()
  if (error) throw new Error(`Failed to create wallet: ${error.message}`)
  return data
}
