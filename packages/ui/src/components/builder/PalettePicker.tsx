'use client'

import { useState } from 'react'
import { Check, PaintBucket, AlertTriangle, Sparkles } from 'lucide-react'
import {
  PALETTE_GROUPS,
  contrastRatio,
  meetsWCAG,
  suggestAccessibleVariant,
  type PaletteColor,
} from '@bixfind/design-tokens/src/builder'
import { cn } from '../../lib/utils'

interface PalettePickerProps {
  selectedPalette: string
  customColors: Record<string, string> | null
  onChange: (paletteName: string, custom?: Record<string, string> | null) => void
}

export function PalettePicker({ selectedPalette, customColors, onChange }: PalettePickerProps) {
  const [activeTab, setActiveTab] = useState<'palettes' | 'custom'>('palettes')
  const [customPrimary, setCustomPrimary] = useState(customColors?.primary ?? '#0066FF')
  const [customBg, setCustomBg] = useState(customColors?.background ?? '#FFFFFF')
  const [customAccent, setCustomAccent] = useState(customColors?.accent ?? '#00D4AA')
  const [contrastWarning, setContrastWarning] = useState<string | null>(null)

  const checkContrast = (fg: string, bg: string, label: string) => {
    const ratio = contrastRatio(fg, bg)
    const passes = meetsWCAG(fg, bg)
    return { ratio: ratio.toFixed(2), passes, label }
  }

  const handleCustomApply = () => {
    const colors = { primary: customPrimary, background: customBg, accent: customAccent }
    const fgOnBg = checkContrast(customPrimary, customBg, 'Primary on background')
    if (!fgOnBg.passes) {
      setContrastWarning(`Primary text (${fgOnBg.ratio}:1) fails WCAG AA on background`)
    } else {
      setContrastWarning(null)
    }
    onChange('custom', colors)
  }

  const handleSuggestVariant = () => {
    const suggested = suggestAccessibleVariant(customPrimary, customBg)
    setCustomPrimary(suggested)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('palettes')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            activeTab === 'palettes' ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white/80'
          )}
        >
          <PaintBucket className="w-4 h-4 inline mr-1" />
          Palettes
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            activeTab === 'custom' ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white/80'
          )}
        >
          Custom
        </button>
      </div>

      {activeTab === 'palettes' && (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {PALETTE_GROUPS.map(group => (
            <div key={group.mood}>
              <h4 className="text-xs font-semibold text-white/55 uppercase tracking-wider mb-2">
                {group.mood}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.palettes.map(palette => (
                  <button
                    key={palette.name}
                    onClick={() => onChange(palette.name, null)}
                    className={cn(
                      'relative p-2 rounded-lg border transition-all hover:scale-[1.02]',
                      selectedPalette === palette.name
                        ? 'border-blue-500 ring-1 ring-blue-500'
                        : 'border-white/10 hover:border-white/30'
                    )}
                  >
                    <div className="flex h-6 rounded overflow-hidden mb-1.5">
                      {palette.colors.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs text-white/70 truncate block">{palette.name}</span>
                    {selectedPalette === palette.name && (
                      <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customPrimary}
                onChange={e => setCustomPrimary(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customPrimary}
                onChange={e => setCustomPrimary(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customBg}
                onChange={e => setCustomBg(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customBg}
                onChange={e => setCustomBg(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={customAccent}
                onChange={e => setCustomAccent(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customAccent}
                onChange={e => setCustomAccent(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white"
              />
            </div>
          </div>

          {contrastWarning && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-yellow-300">{contrastWarning}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCustomApply}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Apply Custom Colors
            </button>
            <button
              onClick={handleSuggestVariant}
              className="px-3 py-2 bg-white/15 text-white/90 text-sm rounded-lg hover:bg-white/20 flex items-center gap-1"
              title="Suggest accessible variant"
            >
              <Sparkles className="w-4 h-4" />
              Suggest
            </button>
          </div>

          <div className="flex gap-2 p-3 bg-white/5 rounded-lg">
            {[customPrimary, customBg, customAccent].map((c, i) => (
              <div key={i} className="flex-1 h-8 rounded" style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="text-xs text-white/55 space-y-1">
            <p>Primary/BG: {checkContrast(customPrimary, customBg, '').ratio}:1 {checkContrast(customPrimary, customBg, '').passes ? '✓' : '✗'}</p>
            <p>Accent/BG: {checkContrast(customAccent, customBg, '').ratio}:1 {checkContrast(customAccent, customBg, '').passes ? '✓' : '✗'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
