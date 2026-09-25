import { z } from "zod"

export const getBookingSlotsTool = {
  type: "function" as const,
  name: "getBookingSlots",
  description: "Get available booking time slots for a specific provider's service",
  parameters: z.object({
    providerId: z.string().describe("The UUID of the provider"),
    serviceId: z.string().optional().describe("The UUID of the specific service"),
    date: z.string().describe("The date to check slots for (YYYY-MM-DD format)"),
  }),
}

export async function getBookingSlots(args: { providerId: string; serviceId?: string; date: string }) {
  const params = new URLSearchParams({
    providerId: args.providerId,
    date: args.date,
  })
  if (args.serviceId) params.set("serviceId", args.serviceId)

  const res = await fetch(`/api/bookings/slots?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to fetch slots: ${res.statusText}`)
  return res.json()
}
