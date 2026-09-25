import { toKobo, type Kobo, type TransactionResponse } from './types'

const FLW_BASE = 'https://api.flutterwave.com/v3'
const SECRET_KEY = () => process.env.FLUTTERWAVE_SECRET_KEY ?? ''

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY()}`,
    'Content-Type': 'application/json',
  }
}

async function flwFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${FLW_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
  })
  const json = await res.json()
  if (json.status !== 'success') {
    throw new Error(json.message ?? 'Flutterwave request failed')
  }
  return json as T
}

export interface FlwInitResponse {
  status: string
  message: string
  data: {
    link: string
    tx_ref: string
  }
}

export async function initializePayment(params: {
  email: string
  amount: Kobo
  txRef: string
  currency?: string
  meta?: Record<string, unknown>
  subaccount?: string
}): Promise<FlwInitResponse> {
  return flwFetch<FlwInitResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount / 100,
      currency: params.currency ?? 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/flutterwave/callback`,
      customer: { email: params.email },
      meta: params.meta,
      subaccounts: params.subaccount
        ? [{ id: params.subaccount }]
        : undefined,
    }),
  })
}

export interface FlwVerifyData {
  id: number
  tx_ref: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export async function verifyPayment(
  transactionId: string,
): Promise<FlwVerifyData> {
  const res = await flwFetch<{
    status: string
    data: FlwVerifyData
  }>(`/transactions/${transactionId}/verify`)
  return res.data
}

export interface FlwTransferData {
  status: string
  data: {
    id: number
    reference: string
    amount: number
    currency: string
    status: string
  }
}

export async function initiateTransfer(params: {
  amount: Kobo
  reference: string
  reason: string
  bankCode: string
  accountNumber: string
  accountName: string
}): Promise<FlwTransferData> {
  return flwFetch<FlwTransferData>('/transfers', {
    method: 'POST',
    body: JSON.stringify({
      account_bank: params.bankCode,
      account_number: params.accountNumber,
      amount: params.amount / 100,
      currency: 'NGN',
      narration: params.reason,
      reference: params.reference,
      beneficiary_name: params.accountName,
    }),
  })
}

export async function createSubaccount(params: {
  businessName: string
  bankCode: string
  accountNumber: string
  splitValue?: number
}): Promise<{ subaccount_id: string }> {
  const res = await flwFetch<{
    status: string
    data: { subaccount_id: string }
  }>('/subaccounts', {
    method: 'POST',
    body: JSON.stringify({
      account_bank: params.bankCode,
      account_number: params.accountNumber,
      business_name: params.businessName,
      split_value: params.splitValue ?? 0.9,
      split_type: 'percentage',
    }),
  })
  return res.data
}
