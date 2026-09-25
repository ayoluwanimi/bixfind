import { createAdminClient } from './supabase/admin'

const FREQUENCY_CAP_WINDOW = 3600000
const FREQUENCY_CAP_LIMIT = 3
const NON_CRITICAL_TYPES = new Set(["BOOKING_UPDATE", "REVIEW", "SYSTEM", "LOW_STOCK"])

export type NotificationType =
  | "BOOKING_NEW"
  | "BOOKING_UPDATE"
  | "MESSAGE"
  | "REVIEW"
  | "PAYOUT"
  | "SYSTEM"
  | "LOW_STOCK"

export interface NotifyData {
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
}

export async function notify(
  userId: string,
  type: NotificationType,
  data: NotifyData,
) {
  try {
    const admin = createAdminClient()

    const { error: dbError } = await admin.from("notifications").insert({
      profile_id: userId,
      type,
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
      is_read: false,
      metadata: data.metadata ?? {},
    })

    if (dbError) {
      console.warn("Notification insert failed:", dbError.message)
    }
  } catch (error) {
    console.warn("notify helper error:", error)
  }
}
