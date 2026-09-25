'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'

interface MediaUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  accept?: string
}

const IMAGE_MAX_DIMENSION = 1600
const IMAGE_QUALITY = 0.82
const VIDEO_MAX_DIMENSION = 1280

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > IMAGE_MAX_DIMENSION || height > IMAGE_MAX_DIMENSION) {
        const ratio = Math.min(IMAGE_MAX_DIMENSION / width, IMAGE_MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        IMAGE_QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

async function compressVideo(file: File): Promise<File> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.preload = 'metadata'
    video.muted = true
    video.onloadeddata = async () => {
      const canvas = document.createElement('canvas')
      let { videoWidth: w, videoHeight: h } = video
      if (w > VIDEO_MAX_DIMENSION || h > VIDEO_MAX_DIMENSION) {
        const ratio = Math.min(VIDEO_MAX_DIMENSION / w, VIDEO_MAX_DIMENSION / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const stream = canvas.captureStream(24)
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_000_000 })
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        URL.revokeObjectURL(url)
        const blob = new Blob(chunks, { type: 'video/webm' })
        if (blob.size < file.size) {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), { type: 'video/webm' }))
        } else {
          resolve(file)
        }
      }
      try {
        video.play()
        recorder.start()
        const drawFrame = () => {
          if (!video.paused && !video.ended) {
            ctx.drawImage(video, 0, 0, w, h)
            requestAnimationFrame(drawFrame)
          } else {
            recorder.stop()
          }
        }
        drawFrame()
      } catch {
        URL.revokeObjectURL(url)
        resolve(file)
      }
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    video.src = url
  })
}

export default function MediaUpload({ value, onChange, folder = 'products', label = 'Upload Image or Video', accept = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm' }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isVideo = value && (value.includes('/videos/') || value.match(/\.(mp4|webm|mov|avi)$/i))

  const handleFile = async (file: File) => {
    const isVideoFile = file.type.startsWith('video/')
    if (isVideoFile && file.size > 50 * 1024 * 1024) {
      toast.error('Video too large (max 50MB)')
      return
    }
    if (!isVideoFile && file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)')
      return
    }

    setUploading(true)
    try {
      let processed = file
      if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        toast.info('Compressing image...')
        processed = await compressImage(file)
      } else if (isVideoFile && file.size > 5 * 1024 * 1024) {
        toast.info('Compressing video...')
        processed = await compressVideo(file)
      }

      const user = storage.getUser()
      const formData = new FormData()
      formData.append('file', processed)
      formData.append('folder', folder)
      if (user?.id) formData.append('userId', user.id)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }
      const { url } = await res.json()
      onChange(url)
      if (processed.size < file.size) {
        const saved = Math.round((1 - processed.size / file.size) * 100)
        toast.success(`Uploaded! Reduced by ${saved}%`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
        {isVideo ? (
          <video src={value} className="w-full h-40 object-cover" controls muted />
        ) : (
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
        )}
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 text-white/80 text-xs">
          {isVideo ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
          {isVideo ? 'Video' : 'Image'}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
        dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      {uploading ? (
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      ) : (
        <Upload className="w-8 h-8 text-white/30" />
      )}
      <span className="text-sm text-white/40">
        {uploading ? 'Uploading...' : label}
      </span>
      <span className="text-xs text-white/20">Images & Videos — auto-compressed</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
