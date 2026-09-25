import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  className?: string
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel = 'from last month',
  icon,
  className = ''
}: StatsCardProps) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-slate-500 ml-1">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}