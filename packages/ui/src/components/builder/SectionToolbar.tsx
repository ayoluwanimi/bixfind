'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { type BuilderSection } from '@bixfind/design-tokens/src/builder'
import { cn } from '../../lib/utils'

interface SectionToolbarProps {
  availableSections: BuilderSection[]
  usedSectionIds: string[]
  onAdd: (section: BuilderSection) => void
}

export function SectionToolbar({ availableSections, usedSectionIds, onAdd }: SectionToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const available = availableSections.filter(s => !usedSectionIds.includes(s.id) || s.id === 'seo')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Section
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-20 p-2 max-h-80 overflow-y-auto">
            {availableSections.map(section => {
              const isUsed = usedSectionIds.includes(section.id)
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (!isUsed || section.id === 'seo') {
                      onAdd(section)
                      setIsOpen(false)
                    }
                  }}
                  disabled={isUsed && section.id !== 'seo'}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isUsed && section.id !== 'seo'
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-200 hover:bg-blue-600/30 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{section.label}</span>
                    {isUsed && <span className="text-[10px] text-gray-400">(added)</span>}
                  </div>
                  <p className="text-[10px] text-gray-300 mt-0.5">{section.description}</p>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
