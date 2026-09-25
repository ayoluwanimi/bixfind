import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpCache: any = null
let sharpChecked = false

async function getSharp() {
  if (sharpChecked) return sharpCache
  sharpChecked = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharpCache = require('sharp')
  } catch {
    // sharp not installed — compression disabled
  }
  return sharpCache
}

async function tryCompressImage(buffer: Buffer, contentType: string): Promise<{ buffer: Buffer; type: string }> {
  const sharp = await getSharp()
  if (!sharp) return { buffer, type: contentType }

  try {
    const input = sharp(buffer)
    const metadata = await input.metadata()
    const isPng = contentType === 'image/png'

    let pipeline = input
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true })
    }
    if (isPng) {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 9 })
      const result = await pipeline.toBuffer()
      return { buffer: result, type: 'image/png' }
    }
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true })
    const result = await pipeline.toBuffer()
    return { buffer: result, type: 'image/jpeg' }
  } catch {
    return { buffer, type: contentType }
  }
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
const ALL_ALLOWED = [...IMAGE_TYPES, ...VIDEO_TYPES]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null
    const folder = formData.get('folder') as string || 'logos'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isVideo = VIDEO_TYPES.includes(file.type)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large (max ${isVideo ? '50MB' : '10MB'})` }, { status: 400 })
    }

    if (!ALL_ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const admin = createAdminClient()
    let buffer = Buffer.from(await file.arrayBuffer())
    let uploadType = file.type
    let ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'png')

    if (IMAGE_TYPES.includes(file.type) && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      const compressed = await tryCompressImage(buffer, file.type)
      buffer = Buffer.from(compressed.buffer)
      uploadType = compressed.type
      ext = compressed.type.includes('png') ? 'png' : 'jpg'
    }

    const storageFolder = isVideo ? 'videos' : 'images'
    const fileName = `${folder}/${userId || 'anon'}/${Date.now()}.${ext}`
    const { error } = await admin.storage
      .from(storageFolder)
      .upload(fileName, buffer, { contentType: uploadType, upsert: false })

    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(storageFolder).getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl, path: fileName, originalSize: file.size, newSize: buffer.length, type: isVideo ? 'video' : 'image' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
