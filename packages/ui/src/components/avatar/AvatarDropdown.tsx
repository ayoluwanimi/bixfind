"use client"

import { useState, useRef, useEffect } from "react"
import { User, LayoutDashboard, Settings, Shield, LogOut, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export type UserRole = "customer" | "provider" | "admin"

export interface AvatarDropdownUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
}

export interface AvatarDropdownMenuItem {
  label: string
  icon: React.ElementType
  href?: string
  onClick?: () => void
  variant?: "default" | "danger" | "admin"
  divider?: boolean
}

export interface AvatarDropdownProps {
  user: AvatarDropdownUser
  onNavigate: (href: string) => void
  onLogout: () => void
  className?: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  provider: "Provider",
  admin: "Admin",
}

const ROLE_COLORS: Record<UserRole, string> = {
  customer: "bg-blue-500/10 text-blue-400",
  provider: "bg-purple-500/10 text-purple-400",
  admin: "bg-amber-500/10 text-amber-400",
}

export function AvatarDropdown({ user, onNavigate, onLogout, className }: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getMenuItems = (): AvatarDropdownMenuItem[] => {
    const items: AvatarDropdownMenuItem[] = [
      { label: "View Profile", icon: User, onClick: () => onNavigate("/profile") },
    ]

    if (user.role === "customer") {
      items.push({ label: "Dashboard", icon: LayoutDashboard, onClick: () => onNavigate("/dashboard") })
    } else if (user.role === "provider") {
      items.push({ label: "Dashboard", icon: LayoutDashboard, onClick: () => onNavigate("/provider/today") })
    } else {
      items.push({ label: "Dashboard", icon: LayoutDashboard, onClick: () => onNavigate("/admin/overview") })
    }

    items.push({ label: "Settings", icon: Settings, onClick: () => onNavigate("/settings") })

    if (user.role === "admin") {
      items.push({
        label: "Admin Panel",
        icon: Shield,
        variant: "admin",
        onClick: () => onNavigate("/admin/overview"),
      })
    }

    items.push({ label: "Logout", icon: LogOut, variant: "danger", divider: true, onClick: onLogout })

    return items
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email.charAt(0).toUpperCase()

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <ChevronDown size={14} className={cn("text-white/50 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/40 truncate mt-0.5">{user.email}</p>
              <span className={cn("inline-block mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full", ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            <div className="py-1">
              {getMenuItems().map((item, i) => (
                <div key={i}>
                  {item.divider && <div className="mx-3 my-1 border-t border-white/10" />}
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      item.onClick?.()
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      item.variant === "danger"
                        ? "text-red-400 hover:bg-red-500/10"
                        : item.variant === "admin"
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
