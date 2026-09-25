'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '../button/Button'
import { getSectionById } from '@bixfind/design-tokens/src/builder'
import type { Block } from './BlockEditor'

interface SectionCanvasProps {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onToggleVisibility: () => void
}

export function SectionCanvas({ block, isSelected, onSelect, onRemove, onToggleVisibility }: SectionCanvasProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const sectionDef = getSectionById(block.sectionId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-500/5'
          : 'border-gray-600 bg-gray-800 hover:border-gray-400'
      } ${!block.visible ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white/80"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider flex-1">
          {sectionDef?.label ?? block.sectionId}
        </span>
        <button
          onClick={onToggleVisibility}
          className="text-white/50 hover:text-white/80 p-1"
          title={block.visible ? 'Hide section' : 'Show section'}
        >
          {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onRemove}
          className="text-red-400/70 hover:text-red-400 p-1"
          title="Remove section"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 cursor-pointer" onClick={onSelect}>
        <div className="text-white/80 text-sm space-y-2">
          {block.sectionId === 'hero' && (
            <div>
              <div className="text-lg font-bold text-white">{String(block.content.title || 'Hero Title')}</div>
              <div className="text-white/60">{String(block.content.tagline || 'Tagline goes here')}</div>
            </div>
          )}
          {block.sectionId === 'about' && (
            <div>
              <div className="font-semibold text-white mb-1">About</div>
              <div className="text-white/60 line-clamp-2">{String(block.content.content || 'About content...')}</div>
            </div>
          )}
          {block.sectionId === 'services' && (
            <div>
              <div className="font-semibold text-white mb-1">Services</div>
              <div className="text-white/60">
                {(block.content.services as Array<{ title: string }>)?.length ?? 0} services configured
              </div>
            </div>
          )}
          {block.sectionId === 'gallery' && (
            <div>
              <div className="font-semibold text-white mb-1">Gallery</div>
              <div className="text-white/60">
                {(block.content.images as string[])?.length ?? 0} images
                {(block.content.videos as string[])?.length ? `, ${(block.content.videos as string[]).length} videos` : ''}
              </div>
            </div>
          )}
          {block.sectionId === 'contact' && (
            <div>
              <div className="font-semibold text-white mb-1">Contact</div>
              <div className="text-white/60">{String(block.content.email || 'No email set')}</div>
            </div>
          )}
          {block.sectionId === 'music' && (
            <div>
              <div className="font-semibold text-white mb-1">Music</div>
              <div className="text-white/60">
                {(block.content.tracks as Array<{ title: string }>)?.length ?? 0} tracks
              </div>
            </div>
          )}
          {block.sectionId === 'hotel' && (
            <div>
              <div className="font-semibold text-white mb-1">Hotel</div>
              <div className="text-white/60">
                {(block.content.rooms as Array<{ name: string }>)?.length ?? 0} rooms
              </div>
            </div>
          )}
          {block.sectionId === 'seo' && (
            <div>
              <div className="font-semibold text-white mb-1">SEO</div>
              <div className="text-white/60">{String(block.content.title || 'No meta title')}</div>
            </div>
          )}
          {block.sectionId === 'products' && (
            <div>
              <div className="font-semibold text-white mb-1">Products</div>
              <div className="text-white/60">
                {(block.content.products as Array<{ name: string }>)?.length ?? 0} products
              </div>
            </div>
          )}
        </div>
        {!block.visible && (
          <span className="mt-2 inline-block text-xs text-yellow-400">Hidden from public view</span>
        )}
      </div>
    </div>
  )
}
