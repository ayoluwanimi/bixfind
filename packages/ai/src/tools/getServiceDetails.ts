import { z } from "zod"

export const getServiceDetailsTool = {
  type: "function" as const,
  name: "getServiceDetails",
  description: "Get detailed information about a specific service including pricing, description, images, and provider info",
  parameters: z.object({
    serviceId: z.string().describe("The UUID of the service to look up"),
  }),
}

export async function getServiceDetails(args: { serviceId: string }) {
  const res = await fetch(`/api/search?serviceId=${args.serviceId}`)
  if (!res.ok) throw new Error(`Service lookup failed: ${res.statusText}`)
  return res.json()
}
