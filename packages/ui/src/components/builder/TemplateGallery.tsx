'use client'

import { useState } from 'react'
import { Check, LayoutGrid, Hotel, Sparkles, UtensilsCrossed, Music, Camera, Dumbbell, PartyPopper, Briefcase } from 'lucide-react'
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  type TemplateConfig,
  type TemplateCategory,
} from '@bixfind/design-tokens/src/builder'
import { cn } from '../../lib/utils'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid className="w-4 h-4" />,
  Hotel: <Hotel className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  UtensilsCrossed: <UtensilsCrossed className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  Dumbbell: <Dumbbell className="w-4 h-4" />,
  PartyPopper: <PartyPopper className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
}

interface TemplateGalleryProps {
  selectedTemplate: string
  onChange: (templateId: string) => void
}

export function TemplateGallery({ selectedTemplate, onChange }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('universal')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  const filtered = TEMPLATES.filter(t => t.category === activeCategory)

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-white/15 text-white'
                : 'text-white/65 hover:text-white/80'
            )}
          >
            {CATEGORY_ICONS[cat.icon]}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-2">
        {filtered.map(template => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            className={cn(
              'relative group text-left p-3 rounded-lg border transition-all',
              selectedTemplate === template.id
                ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-400 bg-gray-800'
            )}
          >
            <div className="aspect-video rounded-md mb-2 overflow-hidden bg-gradient-to-br from-white/10 to-white/5">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-2">
                  <div className={cn(
                    'text-white/80 font-semibold text-xs truncate',
                    template.heroLayout
                  )}>
                    {template.name}
                  </div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {template.sections.slice(0, 4).map(s => (
                      <div key={s} className="w-2 h-2 rounded-full bg-white/35" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs font-medium text-white truncate">{template.name}</div>
            <div className="text-[10px] text-white/55 line-clamp-1">{template.description}</div>
            {selectedTemplate === template.id && (
              <Check className="absolute top-2 right-2 w-4 h-4 text-blue-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
