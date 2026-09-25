'use client'

import { Check } from 'lucide-react'
import { FONT_PAIRS } from '@bixfind/design-tokens/src/builder'
import { cn } from '../../lib/utils'

interface FontPairPickerProps {
  selectedFontPair: string
  onChange: (fontPairId: string) => void
}

export function FontPairPicker({ selectedFontPair, onChange }: FontPairPickerProps) {
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
      {FONT_PAIRS.map(pair => (
        <button
          key={pair.id}
          onClick={() => onChange(pair.id)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-all',
            selectedFontPair === pair.id
              ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-400 bg-gray-800'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">{pair.name}</span>
            {selectedFontPair === pair.id && (
              <Check className="w-3.5 h-3.5 text-blue-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-lg" style={{ fontFamily: pair.heading.family }}>
              {pair.heading.family}
            </p>
            <p className="text-sm" style={{ fontFamily: pair.body.family }}>
              {pair.body.family} — The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="flex gap-1 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-white/65">
              {pair.category}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
