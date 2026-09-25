import { EscrowState, EntryType, PLATFORM_FEE_PERCENT, toKobo, type Kobo } from './types'

export interface EscrowOperation {
  bookingId: string
  amountKobo: Kobo
  platformFeeKobo: Kobo
  providerShareKobo: Kobo
  entryType: EntryType
  prevState: EscrowState | null
  nextState: EscrowState
}

export function buildEscrowHold(amountKobo: Kobo): {
  holdAmount: Kobo
  escrowState: EscrowState
} {
  return { holdAmount: amountKobo, escrowState: EscrowState.HELD }
}

export function buildEscrowRelease(amountKobo: Kobo): {
  platformFeeKobo: Kobo
  providerShareKobo: Kobo
  escrowState: EscrowState
} {
  const fee = toKobo(Math.floor(amountKobo * PLATFORM_FEE_PERCENT / 100))
  const providerShare = toKobo(amountKobo - fee)
  return {
    platformFeeKobo: fee,
    providerShareKobo: providerShare,
    escrowState: EscrowState.RELEASED,
  }
}

export function buildEscrowRefund(): { escrowState: EscrowState } {
  return { escrowState: EscrowState.REFUNDED }
}

export function canTransitionEscrow(
  currentState: EscrowState | null,
  targetState: EscrowState,
): boolean {
  if (currentState === null && targetState === EscrowState.HELD) return true
  if (currentState === EscrowState.HELD && targetState === EscrowState.RELEASED) return true
  if (currentState === EscrowState.HELD && targetState === EscrowState.REFUNDED) return true
  return false
}
