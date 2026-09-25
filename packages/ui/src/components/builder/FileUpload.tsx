'use client'

import { useRef } from 'react'
import { Upload, X, ImageIcon, Video, Music } from 'lucide-react'

interface FileUploadProps {
  value: string
  onChange: (dataUrl: string) => void
  accept?: string
  label?: string
  type?: 'image' | 'video' | 'audio'
}

export function FileUpload({ value, onChange, accept, label, type = 'image' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const Icon = type === 'video' ? Video : type === 'audio' ? Music : ImageIcon

  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-white/50 block">{label}</label>}
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 group">
          {type === 'image' ? (
            <img src={value} alt="" className="w-full h-28 object-cover" />
          ) : type === 'video' ? (
            <video src={value} className="w-full h-28 object-cover" controls />
          ) : (
            <div className="w-full h-20 flex items-center justify-center bg-white/5">
              <Music className="w-8 h-8 text-white/30" />
            </div>
          )}
          <button
            onClick={() => onChange('')}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-20 rounded-lg border border-dashed border-gray-500 flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-900/20 transition-colors cursor-pointer"
        >
          <Upload className="w-5 h-5 text-white/30" />
          <span className="text-[10px] text-white/30">Click to upload {type}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept || (type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : 'image/*')}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        className="hidden"
      />
      {!value && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Or paste URL..."
          className="w-full px-3 py-1.5 bg-gray-800 border-gray-600 rounded text-sm text-white placeholder-white/20"
        />
      )}
    </div>
  )
}
