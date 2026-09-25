'use client'

import { useState } from 'react'
import { X, Plus, Trash2, ImageIcon, Video } from 'lucide-react'
import { getSectionById } from '@bixfind/design-tokens/src/builder'
import { FileUpload } from './FileUpload'
import type { Block } from './BlockEditor'

interface BlockPropertiesProps {
  block: Block
  onChange: (content: Record<string, unknown>) => void
  onClose: () => void
}

export function BlockProperties({ block, onChange, onClose }: BlockPropertiesProps) {
  const sectionDef = getSectionById(block.sectionId)
  if (!sectionDef) return null

  const update = (key: string, value: unknown) => {
    onChange({ ...block.content, [key]: value })
  }

  const renderFields = () => {
    switch (block.sectionId) {
      case 'hero':
        return (
          <div className="space-y-3">
            <Field label="Title">
              <input type="text" value={String(block.content.title || '')} onChange={e => update('title', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
            <Field label="Tagline">
              <input type="text" value={String(block.content.tagline || '')} onChange={e => update('tagline', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
            <Field label="CTA Text">
              <input type="text" value={String(block.content.ctaText || '')} onChange={e => update('ctaText', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
            <Field label="CTA Link">
              <input type="text" value={String(block.content.ctaLink || '')} onChange={e => update('ctaLink', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
            <Field label="Background Type">
              <select value={String(block.content.backgroundType || 'color')} onChange={e => update('backgroundType', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="color">Gradient Color</option>
                <option value="image">Background Image</option>
              </select>
            </Field>
            {block.content.backgroundType === 'image' && (
              <Field label="Background Image">
                <FileUpload value={String(block.content.backgroundImage || '')} onChange={v => update('backgroundImage', v)} type="image" />
              </Field>
            )}
          </div>
        )
      case 'about':
        return (
          <div className="space-y-3">
            <Field label="Content">
              <textarea value={String(block.content.content || '')} onChange={e => update('content', e.target.value)} rows={5} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" />
            </Field>
            <Field label="Image">
              <FileUpload value={String(block.content.image || '')} onChange={v => update('image', v)} type="image" />
            </Field>
          </div>
        )
      case 'services':
        return (
          <div className="space-y-3">
            <Field label="Services (one per line)">
              <textarea value={(block.content.services as Array<{ title: string }>)?.map(s => s.title).join('\n') ?? ''} onChange={e => update('services', e.target.value.split('\n').filter(Boolean).map(title => ({ title, description: '' })))} rows={5} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" />
            </Field>
            <Field label="Service Image">
              <FileUpload value={String((block.content.services as any[])?.[0]?.image || '')} onChange={v => {
                const services = (block.content.services as Array<{ title: string }>) || []
                update('services', services.map((s, i) => i === 0 ? { ...s, image: v } : s))
              }} type="image" />
            </Field>
          </div>
        )
      case 'gallery':
        return <GalleryEditor content={block.content} onChange={onChange} />
      case 'music':
        return (
          <div className="space-y-3">
            <Field label="Tracks (title, one per line)">
              <textarea value={(block.content.tracks as Array<{ title: string }>)?.map(t => t.title).join('\n') ?? ''} onChange={e => update('tracks', e.target.value.split('\n').filter(Boolean).map(title => ({ title, audioUrl: '' })))} rows={4} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" />
            </Field>
            <Field label="Audio File">
              <FileUpload value={String((block.content.tracks as any[])?.[0]?.audioUrl || '')} onChange={v => {
                const tracks = (block.content.tracks as Array<{ title: string }>) || []
                update('tracks', tracks.map((t, i) => i === 0 ? { ...t, audioUrl: v } : t))
              }} type="audio" />
            </Field>
          </div>
        )
      case 'hotel':
        return (
          <div className="space-y-3">
            <Field label="Rooms (name, one per line)">
              <textarea value={(block.content.rooms as Array<{ name: string }>)?.map(r => r.name).join('\n') ?? ''} onChange={e => update('rooms', e.target.value.split('\n').filter(Boolean).map(name => ({ name, price: 0 })))} rows={4} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" />
            </Field>
            <Field label="Amenities (one per line)">
              <textarea value={(block.content.amenities as string[])?.join('\n') ?? ''} onChange={e => update('amenities', e.target.value.split('\n').filter(Boolean))} rows={3} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" />
            </Field>
            <Field label="Check-in Time">
              <input type="time" value={String(block.content.checkinTime || '14:00')} onChange={e => update('checkinTime', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
            <Field label="Check-out Time">
              <input type="time" value={String(block.content.checkoutTime || '12:00')} onChange={e => update('checkoutTime', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" />
            </Field>
          </div>
        )
      case 'contact':
        return (
          <div className="space-y-3">
            <Field label="Email"><input type="email" value={String(block.content.email || '')} onChange={e => update('email', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" /></Field>
            <Field label="Phone"><input type="text" value={String(block.content.phone || '')} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" /></Field>
            <Field label="Address"><input type="text" value={String(block.content.address || '')} onChange={e => update('address', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" /></Field>
          </div>
        )
      case 'products':
        return (
          <div className="space-y-3">
            <Field label="Product Image">
              <FileUpload value={String((block.content.products as any[])?.[0]?.image || '')} onChange={v => {
                const products = (block.content.products as Array<{ name: string }>) || []
                update('products', products.map((p, i) => i === 0 ? { ...p, image: v } : p))
              }} type="image" />
            </Field>
          </div>
        )
      case 'seo':
        return (
          <div className="space-y-3">
            <Field label="Meta Title"><input type="text" value={String(block.content.title || '')} onChange={e => update('title', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" /></Field>
            <Field label="Meta Description"><textarea value={String(block.content.description || '')} onChange={e => update('description', e.target.value)} rows={3} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none" /></Field>
            <Field label="Keywords"><input type="text" value={String(block.content.keywords || '')} onChange={e => update('keywords', e.target.value)} className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white" /></Field>
            <Field label="OG Image">
              <FileUpload value={String(block.content.ogImage || '')} onChange={v => update('ogImage', v)} type="image" />
            </Field>
          </div>
        )
      case 'testimonials':
        return (
          <div className="space-y-3">
            <Field label="Testimonials (name: text, one per line)">
              <textarea
                value={(block.content.testimonials as Array<{ name: string; text?: string }>)?.map(t => `${t.name}: ${t.text || ''}`).join('\n') ?? ''}
                onChange={e => update('testimonials', e.target.value.split('\n').filter(Boolean).map(line => {
                  const [name, ...rest] = line.split(':')
                  return { name: name.trim(), text: rest.join(':').trim(), rating: 5 }
                }))}
                rows={4}
                className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none"
              />
            </Field>
          </div>
        )
      case 'pricing':
        return (
          <div className="space-y-3">
            <Field label="Plans (name | price, one per line)">
              <textarea
                value={(block.content.plans as Array<{ name: string; price?: number }>)?.map(p => `${p.name} | ${p.price || ''}`).join('\n') ?? ''}
                onChange={e => update('plans', e.target.value.split('\n').filter(Boolean).map(line => {
                  const [name, priceStr] = line.split('|').map(s => s.trim())
                  return { name, price: priceStr ? Number(priceStr) : 0, features: [] }
                }))}
                rows={4}
                className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none"
              />
            </Field>
          </div>
        )
      case 'faq':
        return (
          <div className="space-y-3">
            <Field label="Questions (question | answer, one per line)">
              <textarea
                value={(block.content.questions as Array<{ question: string; answer?: string }>)?.map(q => `${q.question} | ${q.answer || ''}`).join('\n') ?? ''}
                onChange={e => update('questions', e.target.value.split('\n').filter(Boolean).map(line => {
                  const [q, ...rest] = line.split('|').map(s => s.trim())
                  return { question: q, answer: rest.join('|').trim() }
                }))}
                rows={4}
                className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white resize-none"
              />
            </Field>
          </div>
        )
      default:
        return <p className="text-sm text-white/40">No editable properties for this section</p>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-sm font-semibold text-white">{sectionDef.label} Properties</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {renderFields()}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/65 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const images = (content.images as string[]) || []
  const videos = (content.videos as string[]) || []

  const addImage = (dataUrl: string) => { onChange({ ...content, images: [...images, dataUrl] }) }
  const removeImage = (i: number) => { onChange({ ...content, images: images.filter((_, idx) => idx !== i) }) }
  const addVideo = (dataUrl: string) => { onChange({ ...content, videos: [...videos, dataUrl] }) }
  const removeVideo = (i: number) => { onChange({ ...content, videos: videos.filter((_, idx) => idx !== i) }) }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/50 font-medium">Images ({images.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <FileUpload value="" onChange={addImage} type="image" label="Add Image" />
      </div>
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-white/50" />
          <span className="text-xs text-white/50 font-medium">Videos ({videos.length})</span>
        </div>
        <div className="space-y-2 mb-2">
          {videos.map((v, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden border border-white/10 group">
              <video src={v} className="w-full h-24 object-cover" controls />
              <button onClick={() => removeVideo(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <FileUpload value="" onChange={addVideo} type="video" label="Add Video" />
      </div>
    </div>
  )
}
