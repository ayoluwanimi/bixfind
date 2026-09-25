import { toKobo, EntryType, PLATFORM_FEE_PERCENT, type Kobo, type WalletEntry, type WalletSummary } from './types'

export function computeWalletSummary(
  balance: number,
  balanceHold: number,
  currency: string,
): WalletSummary {
  return {
    balance: toKobo(Math.round(balance * 100)),
    pending: toKobo(Math.round(balanceHold * 100)),
    available: toKobo(Math.round((balance - balanceHold) * 100)),
    currency,
  }
}

export function computeBalanceChange(
  entryType: EntryType,
  amountKobo: Kobo,
): { balanceDelta: number; holdDelta: number } {
  const amountDecimal = amountKobo / 100
  switch (entryType) {
    case EntryType.CREDIT:
      return { balanceDelta: amountDecimal, holdDelta: 0 }
    case EntryType.DEBIT:
    case EntryType.PAYOUT:
      return { balanceDelta: -amountDecimal, holdDelta: 0 }
    case EntryType.HOLD:
      return { balanceDelta: 0, holdDelta: amountDecimal }
    case EntryType.RELEASE:
      return { balanceDelta: amountDecimal, holdDelta: -amountDecimal }
    case EntryType.REFUND:
      return { balanceDelta: 0, holdDelta: -amountDecimal }
    default:
      return { balanceDelta: 0, holdDelta: 0 }
  }
}

export function formatWalletEntry(entry: {
  id: string
  walletId: string
  profileId: string
  entryType: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  referenceType?: string | null
  referenceId?: string | null
  description?: string | null
  metadata: unknown
  createdAt: Date
}): WalletEntry {
  return {
    id: entry.id,
    walletId: entry.walletId,
    profileId: entry.profileId,
    entryType: entry.entryType as EntryType,
    amount: toKobo(Math.round(Number(entry.amount) * 100)),
    balanceBefore: toKobo(Math.round(Number(entry.balanceBefore) * 100)),
    balanceAfter: toKobo(Math.round(Number(entry.balanceAfter) * 100)),
    referenceType: entry.referenceType ?? undefined,
    referenceId: entry.referenceId ?? undefined,
    description: entry.description ?? undefined,
    metadata: (entry.metadata ?? undefined) as Record<string, unknown> | undefined,
    createdAt: entry.createdAt.toISOString(),
  }
}
