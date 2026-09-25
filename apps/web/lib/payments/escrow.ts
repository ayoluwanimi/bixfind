import { db } from "@/lib/db/supabase-db"
import { EntryType, EscrowState, toKobo, calculateProviderShare, calculatePlatformFee, canTransitionEscrow } from "@bixfind/core"
import { createWalletEntry } from "./wallet-db"
import { withIdempotency } from "./idempotency"
import type { Kobo } from "@bixfind/core"

export async function holdEscrow(
  bookingId: string,
  amountKobo: Kobo,
  idempotencyKey: string,
): Promise<{ walletEntryId: string }> {
  const { data: booking, error } = await db
    .from("bookings")
    .select("*, provider:providers(*)")
    .eq("id", bookingId)
    .single()
  if (error || !booking) throw new Error("Booking not found")
  if (!canTransitionEscrow(null, EscrowState.HELD)) {
    throw new Error("Cannot hold escrow on this booking")
  }

  return withIdempotency("booking", bookingId, "hold", async () => {
    const { data: wallet, error: wErr } = await db
      .from("wallets")
      .select("*")
      .eq("profile_id", booking.provider_id)
      .single()
    if (wErr || !wallet) throw new Error("Provider wallet not found")

    const entry = await createWalletEntry({
      walletId: wallet.id,
      profileId: booking.provider_id,
      entryType: EntryType.HOLD,
      amount: amountKobo,
      referenceType: "booking",
      referenceId: bookingId,
      description: `Escrow hold for booking ${bookingId}`,
      metadata: { bookingId, idempotencyKey },
    })

    await db.from("bookings").update({ escrow_state: EscrowState.HELD }).eq("id", bookingId)

    return { walletEntryId: entry.id }
  })
}

export async function releaseEscrow(
  bookingId: string,
): Promise<{ platformFeeKobo: Kobo; providerShareKobo: Kobo }> {
  const { data: booking, error } = await db
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()
  if (error || !booking) throw new Error("Booking not found")
  if (!canTransitionEscrow(booking.escrow_state as EscrowState, EscrowState.RELEASED)) {
    throw new Error("Escrow cannot be released in current state")
  }

  return withIdempotency("booking", bookingId, "release", async () => {
    const totalAmount = toKobo(Math.round(Number(booking.total_amount) * 100))
    const platformFee = calculatePlatformFee(totalAmount)
    const providerShare = calculateProviderShare(totalAmount)

    const { data: wallet, error: wErr } = await db
      .from("wallets")
      .select("*")
      .eq("profile_id", booking.provider_id)
      .single()
    if (wErr || !wallet) throw new Error("Provider wallet not found")

    await createWalletEntry({
      walletId: wallet.id,
      profileId: booking.provider_id,
      entryType: EntryType.RELEASE,
      amount: totalAmount,
      referenceType: "booking",
      referenceId: bookingId,
      description: `Escrow release for booking ${bookingId}`,
      metadata: { bookingId, platformFee, providerShare },
    })

    await db.from("bookings").update({
      escrow_state: EscrowState.RELEASED,
      commission: platformFee / 100,
    }).eq("id", bookingId)

    return { platformFeeKobo: platformFee, providerShareKobo: providerShare }
  })
}

export async function refundEscrow(
  bookingId: string,
  reason: string,
): Promise<{ success: boolean }> {
  const { data: booking, error } = await db
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()
  if (error || !booking) throw new Error("Booking not found")
  if (!canTransitionEscrow(booking.escrow_state as EscrowState, EscrowState.REFUNDED)) {
    throw new Error("Escrow cannot be refunded in current state")
  }

  return withIdempotency("booking", bookingId, "refund", async () => {
    const { data: wallet, error: wErr } = await db
      .from("wallets")
      .select("*")
      .eq("profile_id", booking.provider_id)
      .single()
    if (wErr || !wallet) throw new Error("Provider wallet not found")

    const totalAmount = toKobo(Math.round(Number(booking.total_amount) * 100))

    await createWalletEntry({
      walletId: wallet.id,
      profileId: booking.provider_id,
      entryType: EntryType.REFUND,
      amount: totalAmount,
      referenceType: "booking",
      referenceId: bookingId,
      description: `Escrow refund for booking ${bookingId}: ${reason}`,
      metadata: { bookingId, reason },
    })

    await db.from("bookings").update({ escrow_state: EscrowState.REFUNDED }).eq("id", bookingId)

    return { success: true }
  })
}
