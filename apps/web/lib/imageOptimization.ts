// Image optimization utilities for BixFind
// Reduces data usage and improves load times

export interface CompressedImage {
  dataUrl: string
  width: number
  height: number
  size: number
  originalSize: number
}

// Compress image before saving
export const compressImage = async (
  file: File | Blob,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      let { width, height } = img
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Get compressed data URL
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      
      // Calculate sizes
      const size = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
      const originalSize = file.size
      
      resolve({
        dataUrl,
        width,
        height,
        size,
        originalSize
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

// Create thumbnail from image data URL
export const createThumbnail = async (
  dataUrl: string,
  size: number = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      // Create square thumbnail
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      // Calculate crop to center square
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2
      
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
      
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

// Lazy load component wrapper
export class LazyLoader {
  private observer: IntersectionObserver | null = null
  private loadedImages: Set<string> = new Set()
  
  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              const src = img.dataset.src
              if (src && !this.loadedImages.has(src)) {
                img.src = src
                img.classList.remove('lazy-loading')
                img.classList.add('lazy-loaded')
                this.loadedImages.add(src)
                this.observer?.unobserve(img)
              }
            }
          })
        },
        {
          rootMargin: '100px', // Start loading 100px before in view
          threshold: 0.01
        }
      )
    }
  }
  
  observe(img: HTMLImageElement) {
    if (this.observer && img.dataset.src) {
      img.classList.add('lazy-loading')
      this.observer.observe(img)
    } else if (img.dataset.src) {
      // Fallback for browsers without IntersectionObserver
      img.src = img.dataset.src
    }
  }
  
  disconnect() {
    this.observer?.disconnect()
  }
}

// Global lazy loader instance
let globalLazyLoader: LazyLoader | null = null

export const getLazyLoader = (): LazyLoader => {
  if (!globalLazyLoader) {
    globalLazyLoader = new LazyLoader()
  }
  return globalLazyLoader
}

// Estimate bandwidth savings
export const estimateSavings = (originalSize: number, compressedSize: number): string => {
  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
  return `${savings}% smaller`
}

// Check if image is too large (base64 data URLs over 500KB are problematic)
export const isLargeDataUrl = (dataUrl: string): boolean => {
  if (!dataUrl.startsWith('data:')) return false
  const base64 = dataUrl.split(',')[1]
  if (!base64) return false
  // Approximate size: base64 is ~4/3 of binary
  const size = (base64.length * 3) / 4
  return size > 500000 // 500KB
}

// Compress existing data URL if too large
export const compressIfNeeded = async (dataUrl: string, maxSize: number = 400000): Promise<string> => {
  if (!dataUrl.startsWith('data:')) return dataUrl
  
  const base64 = dataUrl.split(',')[1]
  if (!base64) return dataUrl
  const size = (base64.length * 3) / 4
  
  if (size <= maxSize) return dataUrl
  
  // Compress the existing data URL
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      
      // Scale down
      let width = img.width
      let height = img.height
      const scale = Math.sqrt(maxSize / size)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// Utility to get image dimensions
export const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith('data:')) {
      resolve({ width: 0, height: 0 })
      return
    }
    
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}
