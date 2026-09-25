'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '../button/Button'
import { SectionCanvas } from './SectionCanvas'
import { SectionToolbar } from './SectionToolbar'
import { BlockProperties } from './BlockProperties'
import { BUILDER_SECTIONS, type BuilderSection } from '@bixfind/design-tokens/src/builder'

export interface Block {
  id: string
  sectionId: string
  content: Record<string, unknown>
  visible: boolean
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  capabilities: Record<string, boolean>
}

export function BlockEditor({ blocks, onChange, capabilities }: BlockEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setInterval>>()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      setLastSaved(new Date())
    }, 3000)
    return () => clearInterval(autosaveRef.current)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(blocks, oldIndex, newIndex))
      }
    },
    [blocks, onChange]
  )

  const addBlock = useCallback(
    (section: BuilderSection) => {
      const newBlock: Block = {
        id: `${section.id}-${Date.now()}`,
        sectionId: section.id,
        content: { ...section.defaultContent },
        visible: true,
      }
      onChange([...blocks, newBlock])
    },
    [blocks, onChange]
  )

  const removeBlock = useCallback(
    (id: string) => {
      onChange(blocks.filter(b => b.id !== id))
      if (selectedBlockId === id) { setSelectedBlockId(null); setPropertiesOpen(false) }
    },
    [blocks, onChange, selectedBlockId]
  )

  const updateBlock = useCallback(
    (id: string, content: Record<string, unknown>) => {
      onChange(blocks.map(b => (b.id === id ? { ...b, content } : b)))
    },
    [blocks, onChange]
  )

  const toggleVisibility = useCallback(
    (id: string) => {
      onChange(blocks.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))
    },
    [blocks, onChange]
  )

  const availableSections = BUILDER_SECTIONS.filter(
    s => s.always || (s.requires && capabilities[s.requires])
  )
  const selectedBlock = blocks.find(b => b.id === selectedBlockId) ?? null

    return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionToolbar
          availableSections={availableSections}
          usedSectionIds={blocks.map(b => b.sectionId)}
          onAdd={addBlock}
        />
        {lastSaved && (
          <span className="text-xs text-white/40">
            Saved {Math.round((Date.now() - lastSaved.getTime()) / 1000)}s ago
          </span>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map(block => (
              <SectionCanvas
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={() => { setSelectedBlockId(block.id); setPropertiesOpen(true) }}
                onRemove={() => removeBlock(block.id)}
                onToggleVisibility={() => toggleVisibility(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {blocks.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
          <p className="text-white/40">Add sections to start building your website</p>
        </div>
      )}
      {propertiesOpen && selectedBlock && (
        <BlockProperties
          block={selectedBlock}
          onChange={content => updateBlock(selectedBlock.id, content)}
          onClose={() => { setPropertiesOpen(false); setSelectedBlockId(null) }}
        />
      )}
    </div>
  )
}
