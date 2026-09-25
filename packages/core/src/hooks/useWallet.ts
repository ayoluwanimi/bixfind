"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { WalletSummary, WalletEntry, PayoutRequest } from "../payments"

const WALLET_KEY = ["wallet"]
const TRANSACTIONS_KEY = ["wallet-transactions"]
const PAYOUTS_KEY = ["payouts"]

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function useWallet() {
  return useQuery({
    queryKey: WALLET_KEY,
    queryFn: () => fetchApi<WalletSummary>("/api/payments/wallet"),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })
}

export function useWalletTransactions(limit = 20) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, limit],
    queryFn: () =>
      fetchApi<{ entries: WalletEntry[]; nextCursor?: string }>(
        `/api/payments/wallet/entries?limit=${limit}`,
      ),
    staleTime: 1000 * 15,
  })
}

export function usePayout() {
  const queryClient = useQueryClient()

  const requestPayout = useMutation({
    mutationFn: (data: {
      amount: number
      bankCode: string
      accountNumber: string
      accountName: string
      mfaCode: string
    }) =>
      fetchApi<PayoutRequest>("/api/payments/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_KEY })
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: PAYOUTS_KEY })
    },
  })

  const payoutHistory = useQuery({
    queryKey: PAYOUTS_KEY,
    queryFn: () =>
      fetchApi<{ payouts: PayoutRequest[] }>("/api/payments/payout/history"),
    staleTime: 1000 * 60,
  })

  return { requestPayout: requestPayout.mutate, isProcessing: requestPayout.isPending, payoutHistory }
}
