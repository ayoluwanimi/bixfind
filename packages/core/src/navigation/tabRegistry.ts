import {
  Sparkles,
  Briefcase,
  ShoppingBag,
  Boxes,
  Calendar,
  Wallet,
  Globe,
  Music,
  Hotel,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface ProviderTab {
  id: string
  label: string
  icon: LucideIcon
  path: string
  requires?: (capabilities: string[]) => boolean
}

export const PROVIDER_TABS: ProviderTab[] = [
  { id: 'today', label: 'Today', icon: Sparkles, path: '/provider/today' },
  { id: 'services', label: 'Services', icon: Briefcase, path: '/provider/services' },
  { id: 'products', label: 'Products', icon: ShoppingBag, path: '/provider/products' },
  { id: 'inventory', label: 'Inventory', icon: Boxes, path: '/provider/inventory' },
  { id: 'bookings', label: 'Bookings', icon: Calendar, path: '/provider/bookings' },
  { id: 'finance', label: 'Finance', icon: Wallet, path: '/provider/finance' },
  { id: 'website', label: 'Website', icon: Globe, path: '/provider/website' },
  { id: 'music', label: 'Music', icon: Music, path: '/provider/music', requires: (c) => c.includes('music') },
  { id: 'hotel', label: 'Hotelia', icon: Hotel, path: '/provider/hotel', requires: (c) => c.includes('hotel') },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/provider/settings' },
] as const

export function getFilteredTabs(capabilities: string[]): ProviderTab[] {
  return PROVIDER_TABS.filter((tab) => {
    if (!tab.requires) return true
    return tab.requires(capabilities)
  })
}

export function getTabById(id: string): ProviderTab | undefined {
  return PROVIDER_TABS.find((t) => t.id === id)
}
