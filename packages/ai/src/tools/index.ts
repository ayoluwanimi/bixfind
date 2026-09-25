import { searchProvidersTool, searchProviders } from "./searchProviders"
import { getServiceDetailsTool, getServiceDetails } from "./getServiceDetails"
import { getBookingSlotsTool, getBookingSlots } from "./getBookingSlots"

export { searchProvidersTool, searchProviders, getServiceDetailsTool, getServiceDetails, getBookingSlotsTool, getBookingSlots }

export const WHITELISTED_TOOLS = [
  searchProvidersTool,
  getServiceDetailsTool,
  getBookingSlotsTool,
] as const
