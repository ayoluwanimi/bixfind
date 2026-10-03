export type Kobo = number & { readonly __brand: unique symbol }

export function toKobo(amount: number): Kobo {
  return Math.round(amount) as Kobo
}

export function koboToNaira(kobo: Kobo): number {
  return kobo / 100
}

export enum EntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  HOLD = 'HOLD',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
}

export enum EscrowState {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

/**
 * Platform fee charged on escrow release, as a whole-number percentage.
 * This is the value actually used by releaseEscrow() (it writes `commission`
 * onto the booking) — Admin → System's "platformFee" setting and the admin
 * dashboards must display this same number. The admin UI shows 5%, so the
 * charged fee must be 5% too; change both together.
 */
export const PLATFORM_FEE_PERCENT = 5

export function calculatePlatformFee(amountKobo: Kobo): Kobo {
  return toKobo(Math.floor(amountKobo * PLATFORM_FEE_PERCENT / 100))
}

export function calculateProviderShare(amountKobo: Kobo): Kobo {
  return toKobo(amountKobo - calculatePlatformFee(amountKobo))
}

export interface PaymentIntent {
  id: string
  reference: string
  amount: Kobo
  currency: string
  status: 'pending' | 'success' | 'failed'
  providerId: string
  customerId: string
  bookingId: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PayoutRequest {
  id: string
  walletId: string
  profileId: string
  amount: Kobo
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  reference: string
  mfaVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface TransactionResponse {
  success: boolean
  reference?: string
  message?: string
  data?: Record<string, unknown>
}

export interface WalletSummary {
  balance: Kobo
  pending: Kobo
  available: Kobo
  currency: string
}

export interface WalletEntry {
  id: string
  walletId: string
  profileId: string
  entryType: EntryType
  amount: Kobo
  balanceBefore: Kobo
  balanceAfter: Kobo
  referenceType?: string
  referenceId?: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface IdempotencyRecord {
  key: string
  response: Record<string, unknown>
  expiresAt: string
}
