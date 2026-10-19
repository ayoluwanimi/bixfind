#!/usr/bin/env node
/**
 * Read-only commission fee audit.
 *
 * Context: escrow releases used to charge a 10% platform fee
 * (PLATFORM_FEE_PERCENT = 10) while admin surfaces showed 5%. The constant
 * was fixed to 5% on commit cdfd200; this script quantifies what history
 * looked like — it READS ONLY and never writes.
 *
 * Usage (from repo root or apps/web, env loaded from apps/web/.env*):
 *   node scripts/audit-commissions.mjs
 *   node scripts/audit-commissions.mjs --verbose   # per-booking rows
 *
 * It needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or their NEXT_PUBLIC_
 * equivalents) to be set. Never prints row values in bulk — only aggregates
 * (unless --verbose is passed).
 */
import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))

// supabase-js lives in apps/web's node_modules (the script runs from repo root)
const appWebDir = path.join(scriptDir, '..', 'apps', 'web')
const requireFromWeb = createRequire(path.join(appWebDir, 'package.json'))
const { createClient } = requireFromWeb('@supabase/supabase-js')

const verbose = process.argv.includes('--verbose')

function loadEnv() {
  // Minimal .env loader without a dependency: try repo-root .env, .env.local
  const candidates = [
    path.join(scriptDir, '..', '.env'),
    path.join(scriptDir, '..', '.env.local'),
    path.join(scriptDir, '..', 'apps', 'web', '.env'),
    path.join(scriptDir, '..', 'apps', 'web', '.env.local'),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
loadEnv()

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC variants). Cannot run audit.')
  process.exit(1)
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// Fee regime boundaries (UTC): releases before this were charged at 10%.
const FEE_FIX_DATE = '2026-10-01T00:00:00Z'

const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + '%' : 'n/a')
const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })

async function main() {
  console.log('════════════════════════════════════════════════')
  console.log(' Bixfind commission audit (READ-ONLY)')
  console.log(` Fee regimes: 10% before ${FEE_FIX_DATE}, 5% after`)
  console.log('════════════════════════════════════════════════\n')

  // 1. Bookings overall
  const { count: bookingCount, error: e1 } = await db
    .from('bookings')
    .select('*', { count: 'exact', head: true })
  if (e1) { console.error('bookings:', e1.message); process.exit(1) }

  // 2. Released bookings — the only ones where commission is actually written
  const { data: released, error: e2 } = await db
    .from('bookings')
    .select('id, total_amount, unit_price, quantity, commission, escrow_state, status, updated_at, created_at')
    .eq('escrow_state', 'RELEASED')
    .order('updated_at', { ascending: false })
    .limit(1000)
  if (e2) { console.error('released bookings:', e2.message); process.exit(1) }

  const rel = released || []
  const totalReleasedAmount = rel.reduce((s, b) => s + Number(b.total_amount || 0), 0)
  const totalCommission = rel.reduce((s, b) => s + Number(b.commission || 0), 0)

  // Split by regime using updated_at (release time updates the row)
  const oldRows = rel.filter((b) => new Date(b.updated_at || b.created_at) < new Date(FEE_FIX_DATE))
  const newRows = rel.filter((b) => new Date(b.updated_at || b.created_at) >= new Date(FEE_FIX_DATE))

  const sum = (rows, f) => rows.reduce((s, b) => s + f(b), 0)
  const oldAmount = sum(oldRows, (b) => Number(b.total_amount || 0))
  const oldComm = sum(oldRows, (b) => Number(b.commission || 0))
  const expectedOld = oldRows.reduce((s, b) => s + (Math.floor(Number(b.total_amount || 0) * 10) / 100), 0)

  const newAmount = sum(newRows, (b) => Number(b.total_amount || 0))
  const newComm = sum(newRows, (b) => Number(b.commission || 0))
  const expectedNew = newRows.reduce((s, b) => s + (Math.floor(Number(b.total_amount || 0) * 5) / 100), 0)

  console.log(`Bookings in DB (total):        ${bookingCount ?? 0}`)
  console.log(`Released (commission written): ${rel.length}`)
  console.log(`  released GMV:                ${money(totalReleasedAmount)}`)
  console.log(`  total commission collected:  ${money(totalCommission)}\n`)

  console.log('── Old regime (releases before fee fix) ──')
  console.log(`  bookings:                    ${oldRows.length}`)
  console.log(`  GMV:                         ${money(oldAmount)}`)
  console.log(`  commission booked:           ${money(oldComm)}`)
  console.log(`  expected at 10%:             ${money(expectedOld)}`)
  console.log(`  drift (booked - expected):   ${money(oldComm - expectedOld)}`)
  console.log(`  effective rate:              ${pct(oldComm, oldAmount)}\n`)

  console.log('── New regime (releases after fee fix) ──')
  console.log(`  bookings:                    ${newRows.length}`)
  console.log(`  GMV:                         ${money(newAmount)}`)
  console.log(`  commission booked:           ${money(newComm)}`)
  console.log(`  expected at 5%:              ${money(expectedNew)}`)
  console.log(`  drift:                       ${money(newComm - expectedNew)}`)
  console.log(`  effective rate:              ${pct(newComm, newAmount)}\n`)

  // 3. Fee exposure summary — what the overcharge actually cost customers
  const potential10 = oldAmount * 0.10
  const fair5 = oldAmount * 0.05
  console.log('── Exposure summary for the old regime ──')
  console.log(`  collected:                   ${money(oldComm)}`)
  console.log(`  would be at 5%:              ${money(fair5)}`)
  console.log(`  total excess charged:        ${money(potential10 - fair5)}`)
  console.log(`                            = ${money((potential10 - fair5))} owed to providers/customers, if any rows exist above`)
  console.log('')

  // 4. Escrow wallet entries referencing these bookings (itemised support)
  const bookingIds = rel.slice(0, 200).map((b) => b.id)
  let holdSum = 0, releaseSum = 0, refundSum = 0
  if (bookingIds.length > 0) {
    const { data: entries, error: e3 } = await db
      .from('wallet_entries')
      .select('reference_id, entry_type, amount')
      .in('reference_id', bookingIds)
    if (e3) console.error('wallet_entries:', e3.message)
    else {
      for (const e of entries || []) {
        const a = Math.abs(Number(e.amount || 0)) / 100
        if (e.entry_type === 'HOLD') holdSum += a
        if (e.entry_type === 'RELEASE') releaseSum += a
        if (e.entry_type === 'REFUND') refundSum += a
      }
    }
  }
  console.log('── Wallet flows over released bookings (first 200) ──')
  console.log(`  HOLD totals:                 ${money(holdSum)}`)
  console.log(`  RELEASE totals:              ${money(releaseSum)}`)
  console.log(`  REFUND totals:               ${money(refundSum)}\n`)

  // 5. Other statuses that never got released (potential future exposure)
  const { data: byState, error: e4 } = await db
    .from('bookings')
    .select('escrow_state, total_amount')
    .neq('escrow_state', 'RELEASED')
  if (!e4 && byState) {
    const buckets = {}
    for (const b of byState) {
      const k = b.escrow_state || 'NULL'
      buckets[k] = (buckets[k] || { n: 0, amount: 0 })
      buckets[k].n += 1
      buckets[k].amount += Number(b.total_amount || 0)
    }
    console.log('── Bookings not yet released (by escrow state) ──')
    Object.entries(buckets).forEach(([k, v]) => {
      console.log(`  ${String(k).padEnd(12)}: ${String(v.n).padStart(4)} bookings, ${money(v.amount)}`)
    })
  }

  if (verbose) {
    console.log('\n── Per-booking detail (released) ──')
    rel.slice(0, 100).forEach((b) => {
      const amt = Number(b.total_amount || 0)
      const comm = Number(b.commission || 0)
      console.log(`  ${b.id} amt=${money(amt)} comm=${money(comm)} rate=${pct(comm, amt)} at=${b.updated_at || b.created_at}`)
    })
  }

  console.log('\nDone — no data was written.')
}

main().catch((e) => {
  console.error('Audit failed:', e?.message || e)
  process.exit(1)
})
