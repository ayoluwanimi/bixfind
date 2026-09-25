"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Star, MapPin, BadgeCheck, ImageOff } from "lucide-react"
import { cn } from "../../lib/utils"
import type { ProviderCard as ProviderCardType } from "@bixfind/validation"

interface ProviderCardProps {
  provider: ProviderCardType
  onClick?: () => void
  className?: string
}

export function ProviderCard({ provider, onClick, className }: ProviderCardProps) {
  const [imgError, setImgError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -12, y: x * 12 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  const initial = provider.businessName.charAt(0).toUpperCase()

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer",
        "border border-white/10 bg-white/5 backdrop-blur-md",
        "hover:border-white/20 hover:bg-white/[0.07]",
        "transition-colors duration-200",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
        {provider.thumbnailUrl && !imgError ? (
          <img
            src={provider.thumbnailUrl}
            alt={provider.businessName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-lg font-bold text-white/50">{initial}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm truncate">
            {provider.businessName}
          </span>
          {provider.isVerified && (
            <BadgeCheck className="w-4 h-4 text-blue-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-white/50 mt-0.5">{provider.primaryCategory}</p>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white/70">{provider.rating.toFixed(1)}</span>
            <span className="text-xs text-white/30">({provider.reviewCount})</span>
          </div>
          {provider.distance != null && (
            <div className="flex items-center gap-1 text-xs text-white/40">
              <MapPin className="w-3 h-3" />
              {provider.distance < 1
                ? `${Math.round(provider.distance * 1000)}m`
                : `${provider.distance.toFixed(1)}km`}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {provider.badges.length > 0 && (
        <div className="hidden sm:flex flex-col gap-1 shrink-0">
          {provider.badges.slice(0, 2).map((badge) => (
            <span
              key={badge}
              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 whitespace-nowrap"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
