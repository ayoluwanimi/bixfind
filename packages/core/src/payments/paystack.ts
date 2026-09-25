import { toKobo, type Kobo, type TransactionResponse } from './types'

const PAYSTACK_BASE = 'https://api.paystack.co'
const SECRET_KEY = () => process.env.PAYSTACK_SECRET_KEY ?? ''

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${SECRET_KEY()}`,
    'Content-Type': 'application/json',
  }
}

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string>) },
  })
  const json = await res.json()
  if (!res.ok || json.status === false) {
    throw new Error(json.message ?? 'Paystack request failed')
  }
  return json as T
}

export interface PaystackInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function initializePayment(params: {
  email: string
  amount: Kobo
  reference: string
  metadata?: Record<string, unknown>
  splitCode?: string
  subaccount?: string
}): Promise<PaystackInitResponse> {
  return paystackFetch<PaystackInitResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      metadata: params.metadata,
      split_code: params.splitCode,
      subaccount: params.subaccount,
    }),
  })
}

export interface PaystackVerifyData {
  status: string
  reference: string
  amount: number
  currency: string
  paid_at: string
  channel: string
  metadata: Record<string, unknown> | null
}

export async function verifyPayment(
  reference: string,
): Promise<PaystackVerifyData> {
  const res = await paystackFetch<{
    status: boolean
    data: PaystackVerifyData
  }>(`/transaction/verify/${reference}`)
  return res.data
}

export interface PaystackTransferData {
  status: boolean
  data: {
    reference: string
    amount: number
    currency: string
    status: string
    transfer_code: string
    recipient: {
      recipient_code: string
      type: string
      name: string
      details: { account_number: string; bank_name: string }
    }
  }
}

export async function initiateTransfer(params: {
  amount: Kobo
  reference: string
  reason: string
  recipientCode: string
}): Promise<PaystackTransferData> {
  return paystackFetch<PaystackTransferData>('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: params.amount,
      reference: params.reference,
      reason: params.reason,
      recipient: params.recipientCode,
    }),
  })
}

export interface PaystackSubaccountData {
  status: boolean
  data: {
    subaccount_code: string
    business_name: string
    percentage_charge: number
  }
}

export async function createSubaccount(params: {
  businessName: string
  settlementBank: string
  accountNumber: string
  percentageCharge?: number
}): Promise<PaystackSubaccountData> {
  return paystackFetch<PaystackSubaccountData>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.settlementBank,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge ?? 10,
    }),
  })
}

export async function createTransferRecipient(params: {
  type: string
  name: string
  accountNumber: string
  bankCode: string
}): Promise<{ recipient_code: string }> {
  const res = await paystackFetch<{
    status: boolean
    data: { recipient_code: string }
  }>('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify({
      type: params.type,
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    }),
  })
  return res.data
}

export async function verifyAccountNumber(params: {
  accountNumber: string
  bankCode: string
}): Promise<{ account_name: string; account_number: string }> {
  const res = await paystackFetch<{
    status: boolean
    data: { account_name: string; account_number: string }
  }>(
    `/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`,
  )
  return res.data
}

export async function getBanks(): Promise<
  { name: string; code: string; slug: string }[]
> {
  const res = await paystackFetch<{
    status: boolean
    data: { name: string; code: string; slug: string }[]
  }>('/bank?country=nigeria')
  return res.data
}
