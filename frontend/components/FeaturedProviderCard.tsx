import React from 'react'
import { Star, MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

interface FeaturedProviderCardProps {
  companyName: string
  category: string
  rating?: number
  reviewCount?: number
  location?: string
  phone?: string
  email?: string
  logoUrl?: string
  services?: string[]
  isPublished?: boolean
  onVisit?: () => void
  className?: string
}

export default function FeaturedProviderCard({
  companyName,
  category,
  rating = 0,
  reviewCount = 0,
  location = '',
  phone = '',
  email = '',
  logoUrl = '',
  services = [],
  isPublished = false,
  onVisit,
  className = ''
}: FeaturedProviderCardProps) {
  return (
    <div className={`group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-secondary/50 transition-all duration-300 ${className}`}>
      {/* Header with gradient overlay */}
      <div className="relative h-32 bg-gradient-to-r from-primary to-secondary">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/20">{companyName.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isPublished ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Category */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-secondary transition-colors">{companyName}</h3>
            <p className="text-sm text-slate-400">{category}</p>
          </div>
          {onVisit && (
            <button onClick={onVisit} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ExternalLink className="w-5 h-5 text-slate-400 hover:text-secondary" />
            </button>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
              />
            ))}
          </div>
          <span className="text-sm text-slate-400">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </span>
        </div>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-300">{location}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 mb-4">
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-secondary/50 transition-colors">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{phone}</span>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-secondary/50 transition-colors">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300 truncate">{email}</span>
            </a>
          )}
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
            {services.slice(0, 3).map((service, idx) => (
              <span key={idx} className="px-3 py-1 text-xs bg-secondary/10 text-secondary rounded-full">
                {service}
              </span>
            ))}
            {services.length > 3 && (
              <span className="px-3 py-1 text-xs bg-slate-700 text-slate-400 rounded-full">
                +{services.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}