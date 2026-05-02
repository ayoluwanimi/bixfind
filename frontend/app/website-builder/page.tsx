'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { 
  Save, Upload, Eye, Settings, Palette, Layout as LayoutIcon, Image as ImageIcon, Type, 
  Link as LinkIcon, Phone, Mail, MapPin, Globe, Twitter, Facebook, Instagram, 
  Linkedin, Plus, Trash2, ChevronRight, ChevronDown, Check,
  X, Loader2, FileText, Clock, Users, DollarSign, AlertCircle, RefreshCw, ExternalLink, Sparkles, Wand2, Video, ChevronUp, ShoppingCart, Tag, Package, BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { storage, compressImage } from '@/lib/storage'
import { realtimeDb } from '@/lib/realtime'
import { saveRateLimiter } from '@/lib/security'

const API_BASE = 'https://api-eal2ibekhq-uc.a.run.app'

const MAX_IMAGES = 50
const MAX_VIDEOS = 5
const MAX_FILE_SIZE_MB = 10

// XSS Prevention - Sanitize user input
const sanitizeInput = (input: string): string => {
  if (!input) return ''
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

// Sanitize text content (allow some HTML but remove dangerous tags)
const sanitizeText = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

const colorPresets = [
  { name: 'Sunset', primary: '#FF1E75', secondary: '#333333' },
  { name: 'Ocean', primary: '#0066FF', secondary: '#00D4AA' },
  { name: 'Forest', primary: '#22C55E', secondary: '#1E3A2F' },
  { name: 'Royal', primary: '#8B5CF6', secondary: '#1E1B4B' },
  { name: 'Minimal', primary: '#000000', secondary: '#6B7280' },
  { name: 'Warm', primary: '#F97316', secondary: '#7C2D12' }
]

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image: string
  images: string[]
}

const MAX_PRODUCT_IMAGES = 30

interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  price: number
  audioUrl: string
  coverUrl: string
  duration: string
}

export default function WebsiteBuilderPage() {
  const [user, setUser] = useState<any>(null)
  const [website, setWebsite] = useState<any>({
    id: '',
    companyName: '',
    displayName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    bannerUrl: '',
    themeColor: '#0066FF',
    secondaryColor: '#00D4AA',
    fontFamily: 'Poppins',
    socialLinks: { website: '', twitter: '', facebook: '', instagram: '', whatsapp: '', tiktok: '', snapchat: '' },
    isProductStore: false,
    isMusicStore: false,
    category: '',
    service: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([])
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [teamMembers, setTeamMembers] = useState<{name: string, role: string, image: string}[]>([])
  const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '', image: '' })
  const [stats, setStats] = useState({ yearsExperience: '5', projectsCompleted: '100', happyClients: '50', awardsWon: '10' })
  const [businessHighlights, setBusinessHighlights] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Section content states (with sanitization)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroTagline, setHeroTagline] = useState('')
  const [aboutContent, setAboutContent] = useState('')
  const [servicesContent, setServicesContent] = useState('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryVideos, setGalleryVideos] = useState<string[]>([])
  const [testimonials, setTestimonials] = useState<string>('[]')
  const [ctaText, setCtaText] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  
  // Sanitized setters for content
  const setHeroTitleSafe = (val: string) => setHeroTitle(sanitizeText(val))
  const setHeroTaglineSafe = (val: string) => setHeroTagline(sanitizeText(val))
  const setAboutContentSafe = (val: string) => setAboutContent(sanitizeText(val))
  const setServicesContentSafe = (val: string) => setServicesContent(sanitizeText(val))
  const setCtaTextSafe = (val: string) => setCtaText(sanitizeText(val))
  const setCtaLinkSafe = (val: string) => setCtaLink(sanitizeInput(val))
  const setContactInfoSafe = (val: string) => setContactInfo(sanitizeText(val))
  
  // Product store states
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', image: '', images: [] })
  const [productImageInputRef, setProductImageInputRef] = useState<HTMLInputElement | null>(null)
  
  // Music store states
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [showMusicForm, setShowMusicForm] = useState(false)
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null)
  const [newTrack, setNewTrack] = useState({ title: '', artist: '', album: '', price: '', audioUrl: '', coverUrl: '' })
  const musicInputRef = useRef<HTMLInputElement>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  
  // Flag to prevent auto-save during initial load
  const isInitialLoad = useRef(true)
  
  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser) {
      window.location.href = '/auth/login'
      return
    }
    setUser(currentUser)
    
    // Load from localStorage first (faster)
    const savedWebsite = storage.getCurrentWebsite()
    if (savedWebsite) {
      setWebsite(savedWebsite)
      if (savedWebsite.sectionContent) {
        setHeroTitle(savedWebsite.sectionContent.heroTitle || '')
        setHeroTagline(savedWebsite.sectionContent.heroTagline || savedWebsite.tagline || '')
        setAboutContent(savedWebsite.sectionContent.aboutContent || '')
        setServicesContent(savedWebsite.sectionContent.servicesContent || '')
        setGalleryImages(savedWebsite.sectionContent.galleryImages || [])
        setGalleryVideos(savedWebsite.sectionContent.galleryVideos || [])
        setTestimonials(savedWebsite.sectionContent.testimonials || '[]')
        setCtaText(savedWebsite.sectionContent.ctaText || '')
        setCtaLink(savedWebsite.sectionContent.ctaLink || '')
        setContactInfo(savedWebsite.sectionContent.contactInfo || '')
      }
      if (savedWebsite.products) setProducts(savedWebsite.products)
      if (savedWebsite.musicTracks) setMusicTracks(savedWebsite.musicTracks)
      if (savedWebsite.faqs) setFaqs(savedWebsite.faqs)
      if (savedWebsite.teamMembers) setTeamMembers(savedWebsite.teamMembers)
      if (savedWebsite.stats) setStats(savedWebsite.stats)
      if (savedWebsite.businessHighlights) setBusinessHighlights(savedWebsite.businessHighlights)
    } else {
      setWebsite(prev => ({
        ...prev,
        displayName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }))
    }
    
    const savedProducts = storage.get('provider_inventory') || []
    if (savedProducts.length > 0) {
      setProducts(savedProducts)
    }
    
    // Load from API in background (with timeout)
    const loadWebsiteData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/websites`, { timeout: 10000 })
        if (response.data?.websites) {
          const allWebsites = Array.isArray(response.data.websites) 
            ? response.data.websites 
            : Object.values(response.data.websites)
          
          const userWebsite = allWebsites.find((w: any) => w.userId === currentUser.id)
          if (userWebsite) {
            setWebsite(userWebsite)
            storage.setCurrentWebsite(userWebsite)
            
            if (userWebsite.sectionContent) {
              setHeroTitle(userWebsite.sectionContent.heroTitle || '')
              setHeroTagline(userWebsite.sectionContent.heroTagline || userWebsite.tagline || '')
              setAboutContent(userWebsite.sectionContent.aboutContent || '')
              setServicesContent(userWebsite.sectionContent.servicesContent || '')
              setGalleryImages(userWebsite.sectionContent.galleryImages || [])
              setGalleryVideos(userWebsite.sectionContent.galleryVideos || [])
              setTestimonials(userWebsite.sectionContent.testimonials || '[]')
              setCtaText(userWebsite.sectionContent.ctaText || '')
              setCtaLink(userWebsite.sectionContent.ctaLink || '')
              setContactInfo(userWebsite.sectionContent.contactInfo || '')
            }
            if (userWebsite.products) setProducts(userWebsite.products)
            if (userWebsite.musicTracks) setMusicTracks(userWebsite.musicTracks)
            if (userWebsite.faqs) setFaqs(userWebsite.faqs)
            if (userWebsite.teamMembers) setTeamMembers(userWebsite.teamMembers)
            if (userWebsite.stats) setStats(userWebsite.stats)
            if (userWebsite.businessHighlights) setBusinessHighlights(userWebsite.businessHighlights)
          }
        }
      } catch (e) {
        console.log('API timeout, using local data')
      } finally {
        // After initial load, allow auto-save
        isInitialLoad.current = false
      }
    }
    
    loadWebsiteData()
  }, [])

  // Compute slug for preview links - always use companyName if available
  const getSlug = () => {
    if (website.companyName) return website.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (user?.fullName) return user.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (user?.email) return user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return 'preview'
  }
  const slug = getSlug()

  // Auto-save functionality - saves EVERYTHING to Firebase, API, and localStorage IMMEDIATELY
  useEffect(() => {
    if (!user || isInitialLoad.current) return
    
    const saveData = async () => {
      // Rate limiting - prevent spam saves
      if (!saveRateLimiter.isAllowed(`save_${user.id}`)) {
        console.log('Rate limited: too many saves, skipping...')
        return
      }
      
      // Build complete section content with ALL data
      const sectionContent = {
        heroTitle,
        heroTagline,
        aboutContent,
        servicesContent,
        galleryImages,
        galleryVideos,
        testimonials,
        ctaText,
        ctaLink,
        contactInfo,
        // Include all other content
        faqs,
        teamMembers,
        stats,
        businessHighlights
      }
      
      // Extract first service as category
      const services = servicesContent.split('\n').filter((s: string) => s.trim())
      const firstService = services[0] || ''
      const category = firstService.trim() || website.category || 'Service Provider'
      
      const websiteId = website.id || `site_${user.id}_${Date.now()}`
      const now = Date.now()
      
      // Build COMPLETE website data with ALL content
      const websiteData = {
        ...website,
        id: websiteId,
        userId: user.id,
        category,
        displayName: website.displayName || heroTitle || 'My Website',
        companyName: website.companyName,
        tagline: heroTagline,
        sectionContent,
        // Save ALL content explicitly
        products,
        musicTracks,
        faqs,
        teamMembers,
        stats,
        businessHighlights,
        // Logo and banner
        logoUrl: website.logoUrl || '',
        bannerUrl: website.bannerUrl || '',
        // Theme
        themeColor: website.themeColor || '#3B82F6',
        // Social links
        socialLinks: website.socialLinks || {},
        // Contact
        contactInfo,
        // Timestamps
        updatedAt: now,
        lastSaved: now
      }
      
      // 1. Save to localStorage immediately
      try {
        storage.setCurrentWebsite(websiteData)
        storage.set('provider_inventory', products)
        storage.set('provider_music', musicTracks)
        storage.set('provider_faqs', faqs)
        storage.set('provider_team', teamMembers)
        storage.set('provider_stats', stats)
        storage.set('provider_highlights', businessHighlights)
        console.log('Saved to localStorage:', websiteId)
      } catch (e) {
        console.error('localStorage save failed:', e)
      }
      
      // 2. Save COMPLETE data to Firebase IMMEDIATELY (PRIMARY STORAGE)
      try {
        await realtimeDb.set(`websites/${websiteId}`, websiteData)
        console.log('✅ Saved COMPLETE website to Firebase:', websiteId)
        console.log('   - Products:', products.length)
        console.log('   - Hero:', heroTitle)
        console.log('   - About:', aboutContent?.substring(0, 50))
      } catch (e) {
        console.error('❌ Firebase save failed:', e)
      }
      
      // 3. Save products separately with images (ENSURE IMAGES SAVE)
      try {
        const productsData = products.map((p: any) => ({
          ...p,
          // Ensure image is always included
          image: p.image || p.images?.[0] || '',
          images: p.images || (p.image ? [p.image] : [])
        }))
        await realtimeDb.set(`products/${user.id}`, productsData)
        console.log('✅ Saved products to Firebase:', productsData.length)
      } catch (e) {
        console.error('❌ Firebase products save failed:', e)
      }
      
      // 4. Save website index for easy listing
      try {
        await realtimeDb.set(`websiteIndex/${websiteId}`, {
          id: websiteId,
          userId: user.id,
          displayName: website.displayName || heroTitle,
          companyName: website.companyName,
          category,
          isPublished: website.isPublished || false,
          hasProducts: products.length > 0,
          hasMusic: musicTracks.length > 0,
          updatedAt: now,
          heroTitle
        })
      } catch (e) {}
      
      // 5. Save to API as backup
      try {
        await axios.put(`${API_BASE}/websites/${websiteId}`, websiteData, { timeout: 10000 })
        console.log('✅ Saved to API')
        
        if (category && category !== 'Service Provider') {
          axios.put(`${API_BASE}/users/${user.id}`, {
            category: category,
            service: category
          }, { timeout: 5000 }).catch(() => {})
        }
      } catch (e) {
        console.log('API backup save failed (Firebase has the data)')
      }
    }
    
    // Debounce to 2 seconds to avoid too many saves
    const timeoutId = setTimeout(saveData, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [
    user, 
    website.id, 
    website.displayName, 
    website.companyName, 
    website.logoUrl, 
    website.bannerUrl,
    website.themeColor,
    website.socialLinks,
    heroTitle, 
    heroTagline, 
    aboutContent, 
    servicesContent, 
    galleryImages, 
    galleryVideos, 
    ctaText, 
    ctaLink, 
    contactInfo,
    products,
    musicTracks,
    faqs,
    teamMembers,
    stats,
    businessHighlights
  ])

  const handleSave = async () => {
    setSaving(true)
    
    const sectionContent = {
      heroTitle,
      heroTagline,
      aboutContent,
      servicesContent,
      galleryImages,
      galleryVideos,
      testimonials,
      ctaText,
      ctaLink,
      contactInfo
    }
    
    // Extract services as array from servicesContent
    const services = servicesContent.split('\n').filter((s: string) => s.trim())
    const firstService = services[0] || ''
    const category = firstService.trim() || website.category || 'Service Provider'
    
    const websiteId = website.id || `site_${user.id}_${Date.now()}`
    const websiteData = {
      ...website,
      id: websiteId,
      category, // Primary service category
      service: category, // Also set service field
      services, // Array of all services for search
      sectionContent,
      products,
      musicTracks,
      faqs,
      teamMembers,
      stats,
      businessHighlights,
      userId: user.id
    }
    
    // Always save to localStorage first
    storage.setCurrentWebsite(websiteData)
    storage.set('provider_inventory', products)
    storage.set('provider_music', musicTracks)
    
    toast.success('Saved locally!')
    
    // Try to save to API (non-blocking)
    try {
      await axios.put(`${API_BASE}/websites/${websiteId}`, websiteData, { timeout: 15000 })
      
      // Also update user with category
      if (category && category !== 'Service Provider') {
        await axios.put(`${API_BASE}/users/${user.id}`, {
          category: category,
          service: category,
          services: services
        }, { timeout: 5000 })
      }
      
      toast.success('Saved to server!')
    } catch (e) {
      console.log('Failed to save to server:', e)
      toast.error('Saved locally - will sync when online')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async () => {
        // Compress logo to max 200x200
        const compressed = await compressImage(reader.result as string, 200, 0.7)
        setWebsite(prev => ({ ...prev, logoUrl: compressed }))
        toast.success('Logo uploaded and compressed!')
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async () => {
        // Compress banner to max 1200px width
        const compressed = await compressImage(reader.result as string, 1200, 0.8)
        setWebsite(prev => ({ ...prev, bannerUrl: compressed }))
        toast.success('Banner uploaded and compressed!')
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(async file => {
        if (galleryImages.length < MAX_IMAGES) {
          const reader = new FileReader()
          reader.onload = async () => {
            // Compress gallery images to max 800px width
            const compressed = await compressImage(reader.result as string, 800, 0.7)
            setGalleryImages(prev => [...prev, compressed].slice(0, MAX_IMAGES))
            toast.success(`Image added!`)
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const addGalleryImage = handleGalleryUpload

  const addGalleryVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      let addedCount = 0
      Array.from(files).forEach(file => {
        if (galleryVideos.length + addedCount < MAX_VIDEOS) {
          // Check file size (limit to 10MB for base64 storage)
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`Video "${file.name}" is too large. Max size is 10MB.`)
            return
          }
          const reader = new FileReader()
          reader.onload = () => {
            setGalleryVideos(prev => [...prev, reader.result as string].slice(0, MAX_VIDEOS))
            toast.success(`Video "${file.name}" added!`)
          }
          reader.onerror = () => {
            toast.error(`Failed to read video "${file.name}"`)
          }
          reader.readAsDataURL(file)
          addedCount++
        }
      })
      if (galleryVideos.length >= MAX_VIDEOS) {
        toast.warning(`Maximum ${MAX_VIDEOS} videos allowed`)
      }
    }
  }
  
  const addVideoByUrl = (url: string) => {
    if (!url) {
      toast.error('Please enter a video URL')
      return
    }
    if (galleryVideos.length >= MAX_VIDEOS) {
      toast.warning(`Maximum ${MAX_VIDEOS} videos allowed`)
      return
    }
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Please enter a valid URL')
      return
    }
    setGalleryVideos(prev => [...prev, url].slice(0, MAX_VIDEOS))
    toast.success('Video URL added!')
  }

  const analyzeImagesWithAI = async () => {
    toast.info('AI analysis coming soon!')
  }

  const generateWithAI = async (section: string) => {
    if (!website.displayName) {
      toast.error('Please enter a business name first')
      return
    }
    
    setIsAnalyzing(true)
    
    // Immediately save current data to localStorage first
    const currentSectionContent = {
      heroTitle,
      heroTagline,
      aboutContent,
      servicesContent
    }
    const currentWebsiteData = {
      ...website,
      sectionContent: currentSectionContent
    }
    storage.setCurrentWebsite(currentWebsiteData)
    
    try {
      const response = await axios.post(`${API_BASE}/ai/generate`, {
        businessName: website.displayName,
        category: website.category || 'service',
        section
      }, { timeout: 15000 })
      
      if (response.data?.content) {
        switch(section) {
          case 'hero':
            setHeroTitle(response.data.content.title || `Welcome to ${website.displayName}`)
            setHeroTagline(response.data.content.tagline || '')
            break
          case 'about':
            setAboutContent(response.data.content)
            break
          case 'services':
            setServicesContent(response.data.content)
            break
          case 'cta':
            setCtaText(response.data.content.text || 'Contact Us Today')
            setCtaLink(response.data.content.link || '#contact')
            break
        }
        toast.success('AI generated content!')
      }
    } catch (e) {
      console.log('AI generation failed, using fallback')
      // Fallback content if API fails
      const fallbackContent: Record<string, any> = {
        hero: { title: `Welcome to ${website.displayName}`, tagline: `Professional ${website.category || 'service'} provider` },
        about: `At ${website.displayName}, we are committed to providing exceptional services. With years of experience, we ensure quality and customer satisfaction in every project.`,
        services: `• Professional ${website.category || 'service'} 1\n• Expert ${website.category || 'service'} 2\n• Quick and reliable service\n• Affordable pricing\n• Customer satisfaction guaranteed`,
        cta: { text: 'Ready to get started? Contact us today!', link: '#contact' }
      }
      
      switch(section) {
        case 'hero':
          setHeroTitle(fallbackContent.hero.title)
          setHeroTagline(fallbackContent.hero.tagline)
          break
        case 'about':
          setAboutContent(fallbackContent.about)
          break
        case 'services':
          setServicesContent(fallbackContent.services)
          break
        case 'cta':
          setCtaText(fallbackContent.cta.text)
          setCtaLink(fallbackContent.cta.link)
          break
      }
      toast.success('Added default content!')
    }
    
    setIsAnalyzing(false)
  }

  const generateLogoAI = async () => {
    if (!website.displayName) {
      toast.error('Please enter a business name first')
      return
    }
    
    setIsAnalyzing(true)
    
    // Generate a simple logo using canvas/placeholder
    // In production, this would call an AI logo generation API
    const businessName = website.displayName
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    // Create a simple colored logo placeholder
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="${randomColor}" width="200" height="200" rx="20"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">
          ${businessName.substring(0, 2).toUpperCase()}
        </text>
      </svg>
    `
    const logoUrl = 'data:image/svg+xml;base64,' + btoa(svg)
    
    setWebsite(prev => ({ ...prev, logoUrl }))
    toast.success('AI generated logo!')
    setIsAnalyzing(false)
  }

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeGalleryVideo = (index: number) => {
    setGalleryVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const currentImages = [...newProduct.images]
      const currentImage = newProduct.image
      
      for (const file of Array.from(files)) {
        if (currentImages.length < MAX_PRODUCT_IMAGES) {
          try {
            // Read file
            const reader = new FileReader()
            const fileData = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
            
            // Compress image
            const compressed = await compressImage(fileData, 800, 0.7)
            
            // Update with compressed image
            if (!currentImage) {
              setNewProduct(prev => ({ 
                ...prev, 
                image: compressed,
                images: [...prev.images, compressed].slice(0, MAX_PRODUCT_IMAGES)
              }))
            } else {
              setNewProduct(prev => ({ 
                ...prev, 
                images: [...prev.images, compressed].slice(0, MAX_PRODUCT_IMAGES)
              }))
            }
            
            currentImages.push(compressed)
          } catch (err) {
            console.error('Image upload failed:', err)
          }
        }
      }
    }
  }

  const handleTrackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setNewTrack(prev => ({ ...prev, coverUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverUpload = handleTrackImageUpload

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setNewTrack(prev => ({ ...prev, audioUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const selectProductImageFromGallery = (img: string) => {
    setNewProduct(prev => ({ ...prev, image: img }))
  }

  const addProduct = () => {
    // Validate inputs
    if (!newProduct.name || newProduct.name.trim() === '') {
      toast.error('Please enter product name')
      return
    }
    if (!newProduct.price || newProduct.price.trim() === '') {
      toast.error('Please enter product price')
      return
    }
    
    const price = parseFloat(newProduct.price)
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price')
      return
    }
    
    try {
      const productImages = newProduct.images.length > 0 ? newProduct.images : (newProduct.image ? [newProduct.image] : [])
      
      if (editingProduct) {
        // Update existing product
        const updatedProduct = {
          ...editingProduct,
          name: newProduct.name.trim(),
          price: price,
          stock: parseInt(newProduct.stock) || 0,
          image: newProduct.image,
          images: productImages
        }
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p))
        toast.success('Product updated!')
      } else {
        // Create new product
        const product: Product = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: newProduct.name.trim(),
          price: price,
          stock: parseInt(newProduct.stock) || 0,
          image: newProduct.image,
          images: productImages
        }
        setProducts(prev => [...prev, product])
        toast.success('Product added to inventory!')
      }
      
      // Build updated products array for saving
      const updatedProducts = editingProduct 
        ? products.map(p => p.id === editingProduct.id ? { ...p, name: newProduct.name.trim(), price: price, stock: parseInt(newProduct.stock) || 0, image: newProduct.image, images: productImages } : p)
        : [...products, { id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: newProduct.name.trim(), price: price, stock: parseInt(newProduct.stock) || 0, image: newProduct.image, images: productImages }]
      
      // CRITICAL: Always save to localStorage FIRST (offline-first)
      storage.set('provider_inventory', updatedProducts)
      storage.set('provider_products', updatedProducts)
      
      // Save to Firebase (non-blocking, with retry on failure)
      if (user) {
        const websiteId = website.id || `site_${user.id}_${Date.now()}`
        
        // Try to save to Firebase
        realtimeDb.set(`products/${user.id}`, updatedProducts).then((success) => {
          if (success) {
            console.log('Product saved to Firebase')
          } else {
            console.log('Product saved locally, will sync to Firebase when online')
          }
        })
        
        // Also save to website data
        realtimeDb.set(`websites/${websiteId}/products`, updatedProducts)
        
        // Also update published website
        realtimeDb.set(`published/${websiteId}/products`, updatedProducts)
      }
      
      // Reset form
      setNewProduct({ name: '', price: '', stock: '', image: '', images: [] })
      setShowProductForm(false)
      setEditingProduct(null)
      
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product. Please try again.')
    }
  }

  const editProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({ name: product.name, price: String(product.price), stock: String(product.stock), image: product.image, images: product.images || [] })
    setShowProductForm(true)
  }

  const editTrack = (track: MusicTrack) => {
    setEditingTrack(track)
    setNewTrack({ title: track.title, artist: track.artist || '', album: track.album || '', price: String(track.price), audioUrl: track.audioUrl || '', coverUrl: track.coverUrl || '' })
    setShowMusicForm(true)
  }

  const addTrack = () => {
    if (newTrack.title && newTrack.price) {
      if (editingTrack) {
        setMusicTracks(prev => prev.map(t => t.id === editingTrack.id ? { ...t, title: newTrack.title, artist: newTrack.artist || '', album: newTrack.album || '', price: parseFloat(newTrack.price), audioUrl: newTrack.audioUrl || '', coverUrl: newTrack.coverUrl || '' } : t))
      } else {
        const track: MusicTrack = {
          id: `track_${Date.now()}`,
          title: newTrack.title,
          artist: newTrack.artist || '',
          album: newTrack.album || '',
          price: parseFloat(newTrack.price),
          audioUrl: newTrack.audioUrl || '',
          coverUrl: newTrack.coverUrl || '',
          duration: '0:00'
        }
        setMusicTracks(prev => [...prev, track])
      }
      setNewTrack({ title: '', artist: '', album: '', price: '', audioUrl: '', coverUrl: '' })
      setShowMusicForm(false)
      setEditingTrack(null)
    }
  }

  const deleteTrack = (id: string) => {
    setMusicTracks(prev => prev.filter(t => t.id !== id))
  }

  const handlePublish = async () => {
    if (!user || !website.displayName || !website.companyName) {
      toast.error('Please fill in business name and URL slug')
      return
    }
    
    setSaving(true)
    
    // Compress images
    const compressedImages: string[] = []
    for (const img of galleryImages) {
      try {
        compressedImages.push(await compressImage(img))
      } catch (e) {
        compressedImages.push(img)
      }
    }
    
    // Compress product images
    const compressedProducts = await Promise.all(
      products.map(async (p) => {
        if (p.image) {
          try {
            return { ...p, image: await compressImage(p.image) }
          } catch (e) {
            return p
          }
        }
        return p
      })
    )
    
    const companyNameSlug = website.companyName || user?.fullName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || user?.email?.split('@')[0] || 'my-business'
    const slug = companyNameSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const websiteId = website.id || `site_${Date.now()}`
    
    const sectionContent = {
      heroTitle,
      heroTagline,
      aboutContent,
      servicesContent,
      galleryImages: compressedImages,
      galleryVideos: galleryVideos.slice(0, 5),
      testimonials,
      ctaText,
      ctaLink,
      contactInfo
    }
    
    const publishedWebsite = {
      ...website,
      id: websiteId,
      userId: user?.id,
      companyName: slug,
      displayName: website.displayName || heroTitle,
      isPublished: true,
      isProductStore: website.isProductStore || products.length > 0,
      isMusicStore: website.isMusicStore || musicTracks.length > 0,
      sectionContent,
      products: products.length > 0 ? compressedProducts : [],
      musicTracks: musicTracks.length > 0 ? musicTracks : [],
      faqs,
      teamMembers,
      stats,
      businessHighlights,
      publishedAt: new Date().toISOString(),
      published: true
    }
    
    // Save to Firebase IMMEDIATELY first (primary cloud storage)
    let firebaseSuccess = false
    try {
      // Save full website data
      await realtimeDb.set(`websites/${websiteId}`, publishedWebsite)
      console.log('✅ Published full website to Firebase:', websiteId)
      
      // Save to published index for easier listing
      await realtimeDb.set(`published/${websiteId}`, {
        id: websiteId,
        userId: user?.id,
        displayName: publishedWebsite.displayName || heroTitle,
        companyName: slug,
        heroTitle: sectionContent.heroTitle,
        tagline: sectionContent.heroTagline,
        aboutContent: sectionContent.aboutContent,
        category: publishedWebsite.category || 'Service',
        isPublished: true,
        hasProducts: products.length > 0,
        hasMusic: musicTracks.length > 0,
        logoUrl: publishedWebsite.logoUrl,
        bannerUrl: publishedWebsite.bannerUrl,
        products: products.length > 0 ? compressedProducts : [],
        publishedAt: new Date().toISOString()
      })
      console.log('✅ Published to index')
      
      // Save products separately with images (ENSURE IMAGES ARE SAVED)
      if (products.length > 0) {
        const productsWithImages = compressedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          description: p.description || '',
          // Ensure images are saved
          image: p.image || '',
          images: p.images || (p.image ? [p.image] : []),
          category: p.category || ''
        }))
        await realtimeDb.set(`products/${user?.id}`, productsWithImages)
        console.log('✅ Saved products with images:', productsWithImages.length)
      }
      
      // Track activity for admin
      try {
        await realtimeDb.push('activity', {
          type: 'website_published',
          action: 'Website Published',
          entityType: 'website',
          entityId: websiteId,
          userId: user?.id,
          userName: user?.fullName || 'Provider',
          details: {
            displayName: publishedWebsite.displayName || heroTitle,
            companyName: slug,
            hasProducts: products.length > 0,
            hasMusic: musicTracks.length > 0
          },
          timestamp: Date.now()
        })
        console.log('✅ Activity tracked: Website Published')
      } catch (e) {
        console.error('Activity tracking failed:', e)
      }
      
      firebaseSuccess = true
    } catch (e) {
      console.error('❌ Firebase publish failed:', e)
    }
    
    // Save to localStorage as backup
    try {
      storage.setCurrentWebsite(publishedWebsite)
      storage.set('provider_inventory', products)
      storage.set('provider_products', products)
      storage.set('provider_faqs', faqs)
      storage.set('provider_team', teamMembers)
      storage.set('provider_stats', stats)
      storage.set('provider_highlights', businessHighlights)
    } catch (storageError: any) {
      if (storageError.name === 'QuotaExceededError') {
        toast.error('Storage full. Please reduce number of images and try again.')
        setSaving(false)
        return
      }
    }
    
    const websites = storage.getMiniWebsites() || []
    const existingIndex = websites.findIndex((w: any) => w.id === websiteId)
    if (existingIndex >= 0) {
      websites[existingIndex] = publishedWebsite
    } else {
      websites.push(publishedWebsite)
    }
    storage.setMiniWebsites(websites)
    
    setWebsite(publishedWebsite)
    
    // Save to API as backup
    try {
      await axios.put(`${API_BASE}/websites/${websiteId}`, publishedWebsite, { timeout: 15000 })
      console.log('✅ Saved to API backup')
    } catch (e) {
      console.log('API backup failed (Firebase has the data)')
    }
    
    toast.success(firebaseSuccess ? 'Website published and synced!' : 'Website published (syncing...)')
    
    const previewUrl = `https://bixfind.indevs.in/profile-site/${slug}`
    window.open(previewUrl, '_blank')
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <Link href="/provider-dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Bixfind" className="h-8 sm:h-10 w-8 sm:w-10" />
            <span className="text-lg sm:text-xl font-bold text-blue-600">Website Builder</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span className="hidden sm:inline">Save Draft</span>
            </button>
            <Link
              href={`/profile-site/${slug}`}
              target="_blank"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs sm:text-sm transition"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Preview</span>
            </Link>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg text-xs sm:text-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              <span className="hidden sm:inline">Publish Website</span>
              <span className="sm:hidden">Publish</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-semibold flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'content' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden xs:inline">Content</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-semibold flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden xs:inline">Products</span> {products.length > 0 && `(${products.length})`}
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-semibold flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'music' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span className="hidden xs:inline">Music</span> {musicTracks.length > 0 && `(${musicTracks.length})`}
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-semibold flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'design' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              Design
            </button>
          </div>
          
          <div className="p-3 sm:p-6">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                      <input
                        type="text"
                        value={website.displayName}
                        onChange={(e) => setWebsite(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                      <input
                        type="text"
                        value={website.companyName}
                        onChange={(e) => setWebsite(prev => ({ ...prev, companyName: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-business"
                      />
                      <p className="text-xs text-gray-500 mt-1">yourwebsite.com/profile-site/{website.companyName || 'your-slug'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={heroTagline}
                        onChange={(e) => setHeroTagline(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Professional services you can trust"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={website.phone}
                        onChange={(e) => setWebsite(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={website.email}
                        onChange={(e) => setWebsite(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={website.address}
                        onChange={(e) => setWebsite(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your business address"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo & Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Logo & Banner</h3>
                    <button
                      onClick={() => generateLogoAI()}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      ✨ AI Logo
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        {website.logoUrl ? (
                          <div className="relative mb-3">
                            <img src={website.logoUrl} alt="Logo" className="h-24 mx-auto object-contain" />
                            <button
                              onClick={() => setWebsite(prev => ({ ...prev, logoUrl: '' }))}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-2">Upload logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <button
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Upload Logo
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        {website.bannerUrl ? (
                          <div className="relative mb-3">
                            <img src={website.bannerUrl} alt="Banner" className="h-32 w-full object-cover rounded-lg" />
                            <button
                              onClick={() => setWebsite(prev => ({ ...prev, bannerUrl: '' }))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-2">Upload banner</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          id="banner-upload"
                        />
                        <button
                          onClick={() => document.getElementById('banner-upload')?.click()}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Upload Banner
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Hero Section</h3>
                    <button
                      onClick={() => generateWithAI('hero')}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      ✨ AI Generate
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                      <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitleSafe(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Welcome to our business"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hero Tagline</label>
                      <textarea
                        value={heroTagline}
                        onChange={(e) => setHeroTagline(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe what makes your business special..."
                      />
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">About Section</h3>
                    <button
                      onClick={() => generateWithAI('about')}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      ✨ AI Generate
                    </button>
                  </div>
                  <textarea
                    value={aboutContent}
                    onChange={(e) => setAboutContentSafe(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tell customers about your business, experience, and why they should choose you..."
                  />
                </div>

                {/* Category Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Service Category</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Car Repairs', 'Hair Salon', 'Tutoring', 'Catering', 'Photography', 'Music', 'Fashion', 'Tech', 'Fitness', 'Real Estate'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setWebsite(prev => ({ ...prev, category: cat, service: cat }))
                          setServicesContent(prev => prev ? `${cat}\n${prev}` : cat)
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          website.category === cat 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={website.category || ''}
                    onChange={(e) => setWebsite(prev => ({ ...prev, category: e.target.value, service: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Or type your custom category"
                  />
                  <p className="text-xs text-gray-500 mt-2">This determines how users find you in search</p>
                </div>

                {/* Services Section */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Services</h3>
                    <button
                      onClick={() => generateWithAI('services')}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    value={servicesContent}
                    onChange={(e) => setServicesContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="List your services (one per line)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each service on a new line</p>
                </div>

                {/* Business Highlights */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Business Highlights</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {businessHighlights.map((highlight, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2">
                        {highlight}
                        <button onClick={() => setBusinessHighlights(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-indigo-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a highlight (e.g., 10+ Years Experience)"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement
                          if (input.value.trim()) {
                            setBusinessHighlights(prev => [...prev, input.value.trim()])
                            input.value = ''
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Testimonials */}
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Testimonials</h3>
                  <textarea
                    value={testimonials}
                    onChange={(e) => setTestimonials(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder='[{"name": "John", "text": "Great service!", "rating": 5}]'
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter JSON array of testimonials</p>
                </div>

                {/* Gallery */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Gallery Images ({galleryImages.length}/{MAX_IMAGES})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                    {galleryImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {galleryImages.length < MAX_IMAGES && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          className="hidden"
                        />
                        <Plus className="w-8 h-8 text-gray-400" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery Videos */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Gallery Videos ({galleryVideos.length}/{MAX_VIDEOS})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                    {galleryVideos.map((video, i) => (
                      <div key={i} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <video src={video} className="w-full h-full object-cover" controls />
                        <button
                          onClick={() => setGalleryVideos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {galleryVideos.length < MAX_VIDEOS && (
                      <label className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition">
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={addGalleryVideo}
                          className="hidden"
                        />
                        <Video className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Upload</span>
                      </label>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      id="videoUrlInput"
                      placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = document.getElementById('videoUrlInput') as HTMLInputElement
                          if (input?.value) {
                            addVideoByUrl(input.value)
                            input.value = ''
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('videoUrlInput') as HTMLInputElement
                        if (input?.value) {
                          addVideoByUrl(input.value)
                          input.value = ''
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                    >
                      Add URL
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Add up to {MAX_VIDEOS} videos. Upload videos up to 10MB or paste a video URL.</p>
                </div>

                {/* Contact Info */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                  <textarea
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter contact details, operating hours, etc."
                  />
                </div>

                {/* Social Links */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Social Media Links</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.website || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                        placeholder="Website URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Twitter className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.twitter || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                        placeholder="Twitter/X URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.facebook || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                        placeholder="Facebook URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.instagram || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                        placeholder="Instagram URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <input
                        type="tel"
                        value={website.socialLinks?.whatsapp || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, whatsapp: e.target.value } }))}
                        placeholder="WhatsApp (e.g., 2349012345678)"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      <input
                        type="url"
                        value={website.socialLinks?.tiktok || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: e.target.value } }))}
                        placeholder="TikTok URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                      </svg>
                      <input
                        type="url"
                        value={website.socialLinks?.snapchat || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, snapchat: e.target.value } }))}
                        placeholder="Snapchat URL"
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Call to Action</h3>
                    <button
                      onClick={() => generateWithAI('cta')}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      AI Generate
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="Contact Us Now"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                      <input
                        type="text"
                        value={ctaLink}
                        onChange={(e) => setCtaLink(e.target.value)}
                        placeholder="#contact"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    Product Store Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add products to sell on your website. Products will be published with your website.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-white p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={website.isProductStore || products.length > 0}
                    onChange={(e) => setWebsite(prev => ({ ...prev, isProductStore: e.target.checked }))}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium">Enable Product Store on my website</span>
                </label>

                {/* Product Form Modal */}
                {showProductForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold mb-4">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                          <input
                            type="text"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter product name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                          <input
                            type="number"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter price"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                          <input
                            type="number"
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter stock quantity"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (up to {MAX_PRODUCT_IMAGES})</label>
                          <input
                            type="text"
                            value={newProduct.image}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Main image URL"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImageUpload}
                            className="mt-2 w-full text-sm border p-2 rounded"
                          />
                          <p className="text-xs text-gray-500 mt-1">Upload multiple images for this product ({newProduct.images.length}/{MAX_PRODUCT_IMAGES})</p>
                          {newProduct.images.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {newProduct.images.map((img, i) => (
                                <div key={i} className="relative">
                                  <img src={img} alt={`Preview ${i + 1}`} className="h-16 w-16 object-cover rounded" />
                                  <button
                                    onClick={() => setNewProduct(prev => ({ 
                                      ...prev, 
                                      images: prev.images.filter((_, idx) => idx !== i),
                                      image: prev.images[0] === img ? (prev.images[1] || '') : prev.image
                                    }))}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {newProduct.image && !newProduct.images.includes(newProduct.image) && (
                            <img src={newProduct.image} alt="Main Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => { setShowProductForm(false); setEditingProduct(null); setNewProduct({ name: '', price: '', stock: '', image: '', images: [] }) }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addProduct}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          {editingProduct ? 'Update' : 'Add'} Product
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {products.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Product</th>
                          <th className="px-4 py-3 text-left">Price</th>
                          <th className="px-4 py-3 text-left">Stock</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map(product => (
                          <tr key={product.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {product.image && (
                                  <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                )}
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">₦{product.price?.toLocaleString()}</td>
                            <td className="px-4 py-3">{product.stock}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => editProduct(product)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white border rounded-lg">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products yet</p>
                    <p className="text-sm text-gray-400">Add products to sell on your website</p>
                  </div>
                )}

                <button
                  onClick={() => { setEditingProduct(null); setNewProduct({ name: '', price: '', stock: '', image: '', images: [] }); setShowProductForm(true) }}
                  className="w-full py-4 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </button>
              </div>
            )}

            {/* Music Tab */}
            {activeTab === 'music' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" />
                    Music Store Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add music tracks for download/sale on your website.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-white p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={website.isMusicStore || musicTracks.length > 0}
                    onChange={(e) => setWebsite(prev => ({ ...prev, isMusicStore: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="font-medium">Enable Music Store on my website</span>
                </label>

                {/* Music Track Form Modal */}
                {showMusicForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold mb-4">
                        {editingTrack ? 'Edit Track' : 'Add New Track'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Track Title *</label>
                          <input
                            type="text"
                            value={newTrack.title}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter track title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                          <input
                            type="text"
                            value={newTrack.artist}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, artist: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter artist name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
                          <input
                            type="text"
                            value={newTrack.album}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, album: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter album name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                          <input
                            type="number"
                            value={newTrack.price}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter price"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL</label>
                          <input
                            type="text"
                            value={newTrack.audioUrl}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, audioUrl: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter audio file URL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                          <input
                            type="text"
                            value={newTrack.coverUrl}
                            onChange={(e) => setNewTrack(prev => ({ ...prev, coverUrl: e.target.value }))}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter cover image URL"
                          />
                          {newTrack.coverUrl && (
                            <img src={newTrack.coverUrl} alt="Cover Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => { setShowMusicForm(false); setEditingTrack(null); setNewTrack({ title: '', artist: '', album: '', price: '', audioUrl: '', coverUrl: '' }) }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addTrack}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          {editingTrack ? 'Update' : 'Add'} Track
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {musicTracks.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Cover</th>
                          <th className="px-4 py-3 text-left">Track</th>
                          <th className="px-4 py-3 text-left">Price</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {musicTracks.map(track => (
                          <tr key={track.id}>
                            <td className="px-4 py-3">
                              {track.coverUrl ? (
                                <img src={track.coverUrl} alt={track.title} className="w-10 h-10 object-cover rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-purple-200 rounded flex items-center justify-center">
                                  <Video className="w-5 h-5 text-purple-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{track.title}</div>
                              <div className="text-xs text-gray-500">{track.artist}</div>
                            </td>
                            <td className="px-4 py-3">₦{track.price?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => editTrack(track)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setMusicTracks(prev => prev.filter(t => t.id !== track.id))}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white border rounded-lg">
                    <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tracks yet</p>
                  </div>
                )}

                <button
                  onClick={() => { setEditingTrack(null); setNewTrack({ title: '', artist: '', album: '', price: '', audioUrl: '', coverUrl: '' }); setShowMusicForm(true) }}
                  className="w-full py-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add New Track
                </button>
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Team Members
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Showcase your team members on your website.</p>
                </div>

                {teamMembers.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {teamMembers.map((member, i) => (
                      <div key={i} className="bg-white border rounded-lg p-4 text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                          {member.image ? (
                            <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.role}</p>
                        <button onClick={() => setTeamMembers(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 mt-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Add Team Member</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newTeamMember.name}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Role/Position"
                      value={newTeamMember.role}
                      onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => {
                        if (newTeamMember.name && newTeamMember.role) {
                          setTeamMembers(prev => [...prev, newTeamMember])
                          setNewTeamMember({ name: '', role: '', image: '' })
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                      Add Member
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    Business Statistics
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Showcase your business achievements.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="text"
                      value={stats.yearsExperience}
                      onChange={(e) => setStats(prev => ({ ...prev, yearsExperience: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projects Completed</label>
                    <input
                      type="text"
                      value={stats.projectsCompleted}
                      onChange={(e) => setStats(prev => ({ ...prev, projectsCompleted: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Happy Clients</label>
                    <input
                      type="text"
                      value={stats.happyClients}
                      onChange={(e) => setStats(prev => ({ ...prev, happyClients: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Awards Won</label>
                    <input
                      type="text"
                      value={stats.awardsWon}
                      onChange={(e) => setStats(prev => ({ ...prev, awardsWon: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

{/* Design Tab - Templates, Colors, Fonts, Social */}
            {activeTab === 'design' && (
              <div className="space-y-8">
                {/* Templates Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <LayoutIcon className="w-5 h-5" />
                    Website Templates
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    {[
                      { id: 'modern', name: 'Modern', preview: 'modern-gradient', colors: ['#0066FF', '#00D4AA'] },
                      { id: 'minimal', name: 'Minimal', preview: 'minimal-white', colors: ['#000000', '#6B7280'] },
                      { id: 'bold', name: 'Bold', preview: 'bold-dark', colors: ['#FF1E75', '#333333'] },
                      { id: 'nature', name: 'Nature', preview: 'nature-green', colors: ['#22C55E', '#1E3A2F'] },
                      { id: 'royal', name: 'Royal', preview: 'royal-purple', colors: ['#8B5CF6', '#1E1B4B'] },
                      { id: 'warm', name: 'Warm', preview: 'warm-orange', colors: ['#F97316', '#7C2D12'] },
                      { id: 'ocean', name: 'Ocean', preview: 'ocean-blue', colors: ['#0EA5E9', '#0369A1'] },
                      { id: 'sunset', name: 'Sunset', preview: 'sunset-pink', colors: ['#EC4899', '#BE185D'] },
                    ].map(template => (
                      <div
                        key={template.id}
                        onClick={() => setWebsite(prev => ({ 
                          ...prev, 
                          themeColor: template.colors[0], 
                          secondaryColor: template.colors[1],
                          template: template.id
                        }))}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition group ${
                          website.template === template.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="h-20 rounded-md mb-2 overflow-hidden relative">
                          <div 
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(135deg, ${template.colors[0]}33, ${template.colors[1]}33)` }}
                          >
                            <div className="p-2">
                              <div className="h-3 w-16 rounded mb-1" style={{ backgroundColor: template.colors[0] }} />
                              <div className="h-2 w-24 rounded mb-2" style={{ backgroundColor: template.colors[1] + '80' }} />
                              <div className="flex gap-1">
                                <div className="h-6 w-6 rounded" style={{ backgroundColor: template.colors[0] }} />
                                <div className="h-6 w-6 rounded" style={{ backgroundColor: template.colors[1] }} />
                                <div className="h-6 w-6 rounded" style={{ backgroundColor: template.colors[0] + '80' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-center block">{template.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Color Theme */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Color Theme</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {colorPresets.map(preset => (
                      <div
                        key={preset.name}
                        onClick={() => setWebsite(prev => ({ ...prev, themeColor: preset.primary, secondaryColor: preset.secondary }))}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          website.themeColor === preset.primary ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: preset.primary }} />
                          <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <span className="text-sm font-medium">{preset.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={website.themeColor}
                          onChange={(e) => setWebsite(prev => ({ ...prev, themeColor: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={website.themeColor}
                          onChange={(e) => setWebsite(prev => ({ ...prev, themeColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={website.secondaryColor}
                          onChange={(e) => setWebsite(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={website.secondaryColor}
                          onChange={(e) => setWebsite(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Font Selection */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Font Selection
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      // Sans-Serif Fonts
                      { name: 'Poppins', family: 'Poppins, sans-serif', category: 'Sans-Serif' },
                      { name: 'Roboto', family: 'Roboto, sans-serif', category: 'Sans-Serif' },
                      { name: 'Open Sans', family: '"Open Sans", sans-serif', category: 'Sans-Serif' },
                      { name: 'Lato', family: 'Lato, sans-serif', category: 'Sans-Serif' },
                      { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Sans-Serif' },
                      { name: 'Raleway', family: 'Raleway, sans-serif', category: 'Sans-Serif' },
                      { name: 'Nunito', family: 'Nunito, sans-serif', category: 'Sans-Serif' },
                      { name: 'Quicksand', family: 'Quicksand, sans-serif', category: 'Sans-Serif' },
                      { name: 'Work Sans', family: '"Work Sans", sans-serif', category: 'Sans-Serif' },
                      { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', category: 'Sans-Serif' },
                      { name: 'Oswald', family: 'Oswald, sans-serif', category: 'Sans-Serif' },
                      { name: 'Rubik', family: 'Rubik, sans-serif', category: 'Sans-Serif' },
                      // Serif Fonts
                      { name: 'Playfair Display', family: '"Playfair Display", serif', category: 'Serif' },
                      { name: 'Lora', family: 'Lora, serif', category: 'Serif' },
                      { name: 'Merriweather', family: 'Merriweather, serif', category: 'Serif' },
                      { name: 'PT Serif', family: '"PT Serif", serif', category: 'Serif' },
                      { name: 'Libre Baskerville', family: '"Libre Baskerville", serif', category: 'Serif' },
                      { name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif', category: 'Serif' },
                      // Script/Cursive Fonts
                      { name: 'Dancing Script', family: '"Dancing Script", cursive', category: 'Script' },
                      { name: 'Pacifico', family: 'Pacifico, cursive', category: 'Script' },
                      { name: 'Caveat', family: 'Caveat, cursive', category: 'Script' },
                      { name: 'Great Vibes', family: '"Great Vibes", cursive', category: 'Script' },
                      // Modern/Display Fonts
                      { name: 'Bebas Neue', family: '"Bebas Neue", sans-serif', category: 'Display' },
                      { name: 'Anton', family: 'Anton, sans-serif', category: 'Display' },
                      { name: 'Abril Fatface', family: '"Abril Fatface", display', category: 'Display' },
                      { name: 'Alfa Slab One', family: '"Alfa Slab One", display', category: 'Display' },
                    ].map(font => (
                      <div
                        key={font.name}
                        onClick={() => setWebsite(prev => ({ ...prev, fontFamily: font.family }))}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                          website.fontFamily === font.family ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <div 
                          className="text-base mb-1"
                          style={{ fontFamily: font.family }}
                        >
                          Aa Bb Cc
                        </div>
                        <span className="text-xs font-medium">{font.name}</span>
                        <span className="block text-[10px] text-gray-400">{font.category}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Font Family (Google Fonts)</label>
                    <input
                      type="text"
                      value={website.fontFamily}
                      onChange={(e) => setWebsite(prev => ({ ...prev, fontFamily: e.target.value }))}
                      placeholder="e.g., Poppins, sans-serif"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Social Media */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Social Media Links</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.website || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                        placeholder="Website URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Twitter className="w-5 h-5 text-blue-400" />
                      <input
                        type="url"
                        value={website.socialLinks?.twitter || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                        placeholder="Twitter URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <input
                        type="url"
                        value={website.socialLinks?.facebook || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                        placeholder="Facebook URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <input
                        type="url"
                        value={website.socialLinks?.instagram || ''}
                        onChange={(e) => setWebsite(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                        placeholder="Instagram URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
