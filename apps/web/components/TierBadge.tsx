const TIER_STYLES: Record<string, { label: string; className: string }> = {
  GOLD: { label: 'Gold', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  SILVER: { label: 'Silver', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  BRONZE: { label: 'Verified', className: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export default function TierBadge({ tier, verified }: { tier?: string | null; verified?: boolean }) {
  const t = (tier || '').toUpperCase()
  const style = TIER_STYLES[t]
  if (style) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full border ${style.className}`}>
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.86 3.77.91 5.32L10 13.2l-4.78 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" /></svg>
        {style.label}
      </span>
    )
  }
  if (verified) {
    return (
      <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full border border-blue-200">
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 011.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" /></svg>
        Verified
      </span>
    )
  }
  return null
}
