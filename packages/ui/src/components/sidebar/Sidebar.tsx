"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  CalendarCheck,
  Heart,
  MessageSquare,
  Wallet,
  Settings,
  ListTodo,
  Package,
  Archive,
  DollarSign,
  Globe,
  Users,
  Landmark,
  FileText,
  LifeBuoy,
  Monitor,
  ChevronLeft,
  Menu,
  X,
  ShieldCheck,
  History,
  Star,
  Shield,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { UserRole } from "../avatar/AvatarDropdown"

export interface SidebarNavItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: number
}

const CUSTOMER_NAV: SidebarNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Bookings", icon: CalendarCheck, href: "/bookings" },
  { label: "Favorites", icon: Heart, href: "/favorites" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Wallet", icon: Wallet, href: "/wallet" },
  { label: "Settings", icon: Settings, href: "/settings" },
]

const PROVIDER_NAV: SidebarNavItem[] = [
  { label: "Today", icon: ListTodo, href: "/provider/today" },
  { label: "Services", icon: ListTodo, href: "/provider/services" },
  { label: "Products", icon: Package, href: "/provider/products" },
  { label: "Inventory", icon: Archive, href: "/provider/inventory" },
  { label: "Bookings", icon: CalendarCheck, href: "/provider/bookings" },
  { label: "Finance", icon: DollarSign, href: "/provider/finance" },
  { label: "Website", icon: Globe, href: "/provider/website" },
  { label: "Portfolio", icon: Monitor, href: "/provider/portfolio" },
  { label: "Orders", icon: FileText, href: "/provider/orders" },
  { label: "Chat", icon: MessageSquare, href: "/provider/chat" },
  { label: "Support", icon: LifeBuoy, href: "/provider/support" },
  { label: "KYC", icon: ShieldCheck, href: "/provider/kyc" },
  { label: "Settings", icon: Settings, href: "/provider/settings" },
]

const ADMIN_NAV: SidebarNavItem[] = [
  { label: "Overview", icon: Monitor, href: "/admin/overview" },
  { label: "People", icon: Users, href: "/admin/people" },
  { label: "Top Service Providers", icon: Star, href: "/admin/top-providers" },
  { label: "Websites", icon: Globe, href: "/admin/websites" },
  { label: "Money", icon: Landmark, href: "/admin/money" },
  { label: "Content", icon: FileText, href: "/admin/content" },
  { label: "Support", icon: LifeBuoy, href: "/admin/support" },
  { label: "System", icon: Monitor, href: "/admin/system" },
  { label: "Audit", icon: History, href: "/admin/audit" },
  { label: "KYC", icon: Shield, href: "/admin/kyc" },
]

const NAV_MAP: Record<UserRole, SidebarNavItem[]> = {
  customer: CUSTOMER_NAV,
  provider: PROVIDER_NAV,
  admin: ADMIN_NAV,
}

export interface SidebarProps {
  role: UserRole
  currentPath: string
  onNavigate: (href: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
  className?: string
}

export function Sidebar({
  role,
  currentPath,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  className,
}: SidebarProps) {
  const navItems = NAV_MAP[role] || CUSTOMER_NAV

  const isActive = (href: string) => {
    if (href === "/dashboard") return currentPath === "/dashboard"
    return currentPath.startsWith(href)
  }

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-gray-900/90 backdrop-blur-xl transition-all duration-200",
        isCollapsed ? "w-16" : "w-60",
        className,
      )}
    >
      <div className={cn("flex items-center border-b border-white/10 px-3 py-3", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Navigation</span>}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} className={cn("transition-transform", isCollapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white hover:bg-white/5",
                isCollapsed && "justify-center px-0",
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full shrink-0">{sidebarContent}</div>

      {/* Mobile slide-out */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 h-full w-64 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
