"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useCallback } from "react"

export type NotificationType =
  | "BOOKING_NEW"
  | "BOOKING_UPDATE"
  | "MESSAGE"
  | "REVIEW"
  | "PAYOUT"
  | "SYSTEM"
  | "LOW_STOCK"

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface NotificationPreference {
  type: NotificationType
  in_app: boolean
  push: boolean
  email: boolean
}

export interface NotificationSettings {
  preferences: NotificationPreference[]
  push_enabled: boolean
  email_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

const NOTIFICATIONS_KEY = ["notifications"]
const NOTIFICATION_COUNT_KEY = ["notification-count"]
const NOTIFICATION_SETTINGS_KEY = ["notification-settings"]

async function fetchFromApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam }) =>
      fetchFromApi<{ notifications: AppNotification[]; nextCursor?: string }>(
        `/api/notifications?cursor=${pageParam ?? ""}&limit=20`,
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })

  const queryClient = useQueryClient()

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetchFromApi(`/api/notifications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_COUNT_KEY })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetchFromApi("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_COUNT_KEY })
    },
  })

  const markAsRead = useCallback((id: string) => markReadMutation.mutate(id), [markReadMutation])
  const markAllAsRead = useCallback(() => markAllReadMutation.mutate(), [markAllReadMutation])

  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? []

  return { notifications, markAsRead, markAllAsRead, isLoading: query.isLoading, ...query }
}

export function useNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_COUNT_KEY,
    queryFn: () => fetchFromApi<{ count: number }>("/api/notifications?count=true"),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  })
}

export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: NOTIFICATION_SETTINGS_KEY,
    queryFn: () => fetchFromApi<NotificationSettings>("/api/notifications/settings"),
    staleTime: 1000 * 60 * 5,
  })

  const updateMutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      fetchFromApi("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_SETTINGS_KEY })
    },
  })

  return { settings: query.data, updateSettings: updateMutation.mutate, isLoading: query.isLoading }
}
