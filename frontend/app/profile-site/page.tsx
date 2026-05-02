'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { 
  Phone, Mail, MapPin, Globe, Twitter, Facebook, Instagram, Linkedin,
  Menu, X, ChevronRight, ChevronLeft, Star, Loader2, ShoppingCart, Plus, Minus, Trash2, Package,
  Music, Download, MessageCircle, Share2, Copy, Check
} from 'lucide-react'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'
import { realtimeDb } from '@/lib/realtime'
import ChatWidget from '@/components/ChatWidget'

const API_BASE = 'https://api-eal2ibekhq-uc.a.run.app'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

interface LightboxState {
  isOpen: boolean
  type: 'image' | 'video'
  index: number
  items: string[]
}

export default function ProfileSitePage() {
  const [slug, setSlug] = useState('')
  const [website, setWebsite] = useState<any>(null)
  const [provider, setProvider] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxState>({ isOpen: false, type: 'image', index: 0, items: [] })
  const [copied, setCopied] = useState(false)
  
  const openLightbox = (type: 'image' | 'video', index: number, items: string[]) => {
    setLightbox({ isOpen: true, type, index, items })
  }
  
  const closeLightbox = () => {
    setLightbox(prev => ({ ...prev, isOpen: false }))
  }
  
  const nextItem = () => {
    setLightbox(prev => ({
      ...prev,
      index: (prev.index + 1) % prev.items.length
    }))
  }
  
  const prevItem = () => {
    setLightbox(prev => ({
      ...prev,
      index: prev.index === 0 ? prev.items.length - 1 : prev.index - 1
    }))
  }
  
  const websiteUrl = typeof window !== 'undefined' ? window.location.href : ''
  
  const copyLink = () => {
    navigator.clipboard.writeText(websiteUrl)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }
  
  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Check out ${displayName} on BixFind: ${websiteUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }
  
  const chatOnWhatsApp = () => {
    const whatsapp = socialLinks?.whatsapp
    if (whatsapp) {
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${cleanNumber}`, '_blank')
    } else if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

useEffect(() => {
    const loadWebsite = async () => {
      const path = window.location.pathname
      const match = path.match(/\/profile-site\/([^\/]+)/)
      const extractedSlug = match ? match[1] : ''
      setSlug(extractedSlug)
      
      if (!extractedSlug) {
        setLoading(false)
        return
      }
      
      const formattedSlug = extractedSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Helper function to check if website EXACTLY matches slug (STRICT)
      const matchWebsite = (w: any): boolean => {
        if (!w) return false
        const wCompanyName = (w.companyName || '').toLowerCase().trim()
        const wDisplayName = (w.displayName || '').toLowerCase().trim()
        const wSlug = wCompanyName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const wDisplaySlug = wDisplayName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const inputSlug = extractedSlug.toLowerCase().trim()
        const inputFormatted = formattedSlug.toLowerCase().trim()
        
        if (wSlug === inputFormatted) return true
        if (wDisplaySlug === inputFormatted) return true
        if (wCompanyName === inputSlug) return true
        if (wDisplayName === inputSlug) return true
        if (w.id === extractedSlug) return true
        if (w.companyName === extractedSlug) return true
        
        return false
      }
      
      // 1. FAST: Check localStorage FIRST (instant)
      let loadedWebsite = null
      let loadedProvider = null
      
      const currentWebsite = storage.getCurrentWebsite()
      if (currentWebsite && matchWebsite(currentWebsite)) {
        loadedWebsite = currentWebsite
        setWebsite(loadedWebsite)
        console.log('Profile-site: Found in currentWebsite:', loadedWebsite.displayName || loadedWebsite.companyName)
      }
      
      if (!loadedWebsite) {
        const miniWebsites = storage.getMiniWebsites() || []
        const found = miniWebsites.find(matchWebsite)
        if (found) {
          loadedWebsite = found
          setWebsite(loadedWebsite)
          console.log('Profile-site: Found in miniWebsites:', loadedWebsite.displayName || loadedWebsite.companyName)
        }
      }
      
      // 2. FAST: Check localStorage cache for this slug
      if (!loadedWebsite) {
        const cachedWebsites = storage.get('cached_websites') || {}
        const cached = cachedWebsites[formattedSlug] || cachedWebsites[extractedSlug]
        if (cached && matchWebsite(cached)) {
          loadedWebsite = cached
          setWebsite(loadedWebsite)
          console.log('Profile-site: Found in cache:', loadedWebsite.displayName)
        }
      }
      
      // If we found a website, we're done (show immediately)
      if (loadedWebsite) {
        setLoading(false)
        
        // Update in background with fresh data (non-blocking)
        setTimeout(() => refreshWebsiteData(extractedSlug, formattedSlug, matchWebsite), 100)
        return
      }
      
      // 3. SLOW: Try Firebase only if not found in localStorage
      try {
        const fbWebsites = await realtimeDb.get('websites')
        if (fbWebsites) {
          const websiteList = Object.values(fbWebsites) as any[]
          const exactMatch = websiteList.find(matchWebsite)
          if (exactMatch) {
            loadedWebsite = exactMatch
            setWebsite(loadedWebsite)
            setLoading(false)
            
            // Cache for next time
            const cachedWebsites = storage.get('cached_websites') || {}
            cachedWebsites[formattedSlug] = loadedWebsite
            storage.set('cached_websites', cachedWebsites)
            
            console.log('Profile-site: Found in Firebase:', loadedWebsite.displayName || loadedWebsite.companyName)
            return
          }
        }
      } catch (e) {
        console.error('Profile-site: Firebase error:', e)
      }
      
      // 4. SLOW: Try API as last resort
      try {
        const response = await axios.get(`${API_BASE}/websites`, { timeout: 8000 })
        if (response.data?.websites) {
          const allWebsites = Array.isArray(response.data.websites) 
            ? response.data.websites 
            : Object.values(response.data.websites)
          const apiMatch = allWebsites.find(matchWebsite)
          if (apiMatch) {
            loadedWebsite = apiMatch
            setWebsite(loadedWebsite)
            
            // Cache for next time
            const cachedWebsites = storage.get('cached_websites') || {}
            cachedWebsites[formattedSlug] = loadedWebsite
            storage.set('cached_websites', cachedWebsites)
            
            console.log('Profile-site: Found in API:', loadedWebsite.displayName || loadedWebsite.companyName)
          }
        }
      } catch (e) {
        console.error('Profile-site: API error:', e)
      }
      
      setLoading(false)
      console.log('Loaded:', { website: !!loadedWebsite, provider: !!loadedProvider, slug: extractedSlug })
    }
    
    // Background refresh function (non-blocking)
    const refreshWebsiteData = async (extractedSlug: string, formattedSlug: string, matchWebsite: (w: any) => boolean) => {
      try {
        const fbWebsites = await realtimeDb.get('websites')
        if (fbWebsites) {
          const websiteList = Object.values(fbWebsites) as any[]
          const exactMatch = websiteList.find(matchWebsite)
          if (exactMatch && exactMatch.products?.length > 0) {
            setWebsite(prev => ({
              ...prev,
              ...exactMatch,
              products: exactMatch.products
            }))
            
            // Update cache
            const cachedWebsites = storage.get('cached_websites') || {}
            cachedWebsites[formattedSlug] = { ...(cachedWebsites[formattedSlug] || {}), ...exactMatch }
            storage.set('cached_websites', cachedWebsites)
          }
        }
      } catch (e) {}
    }
    
    loadWebsite()
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // If no website and no provider found, show error
  if (!website && !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">This provider's website does not exist.</p>
          <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
        </div>
      </div>
    )
  }
  
  // Format slug for display
  const formattedSlugName = slug 
    ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : ''
  
  // Get display data from website or provider
  const displayName = website?.displayName || provider?.fullName || formattedSlugName || 'Service Provider'
  const tagline = website?.tagline || 'Professional services in Nigeria'
  const phone = website?.phone || provider?.phone || ''
  const email = website?.email || provider?.email || ''
  const address = website?.address || ''
  const logoUrl = website?.logoUrl || ''
  const bannerUrl = website?.bannerUrl || ''
  const themeColor = website?.themeColor || '#0066FF'
  const socialLinks = website?.socialLinks || {}
  
  // Get section content
  const sectionContent = website?.sectionContent || {}
  const heroTitle = sectionContent.heroTitle || displayName
  const heroTagline = sectionContent.heroTagline || tagline
  const aboutContent = sectionContent.aboutContent || ''
  const servicesContent = sectionContent.servicesContent || ''
  const galleryImages = sectionContent.galleryImages || []
  const galleryVideos = sectionContent.galleryVideos || []
  const ctaText = sectionContent.ctaText || 'Contact Us'
  const ctaLink = sectionContent.ctaLink || (phone ? `tel:${phone}` : '#')
  const contactInfo = sectionContent.contactInfo || 'Get in touch with us today!'
  
  // Parse services
  const servicesList = servicesContent ? servicesContent.split('\n').filter(s => s.trim()) : []
  
  // Get products
  const products = website?.products || []
  const isProductStore = website?.isProductStore || false
  
  // Get music tracks
  const musicTracks = website?.musicTracks || []
  const isMusicStore = website?.isMusicStore || false
  
  // Cart functions
  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }])
    }
    toast.success(`${product.name} added to cart!`)
  }
  
  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity > 0))
  }
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }
  
  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  
  // If no slug at all, show welcome
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Bixfind Sites</h1>
          <p className="text-gray-600 mb-6">Create your mini website from the provider dashboard</p>
          <a href="https://bixfind.indevs.in" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Bixfind <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: website?.fontFamily || 'Poppins' }}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${isScrolled ? 'bg-white shadow-lg' : 'bg-white/95'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="h-10" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: themeColor }}>{displayName}</span>
              )}
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-gray-700 hover:text-gray-900">About</a>
              {servicesList.length > 0 && <a href="#services" className="text-gray-700 hover:text-gray-900">Services</a>}
              {(galleryImages.length > 0 || galleryVideos.length > 0) && <a href="#gallery" className="text-gray-700 hover:text-gray-900">Gallery</a>}
              {isProductStore && products.length > 0 && <a href="#products" className="text-gray-700 hover:text-gray-900">Products</a>}
              {isMusicStore && musicTracks.length > 0 && <a href="#music" className="text-gray-700 hover:text-gray-900">Music</a>}
              <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
              {isProductStore && products.length > 0 && (
                <button 
                  onClick={() => setShowCart(true)}
                  className="relative p-2 rounded-lg hover:bg-gray-100"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="px-4 py-2 rounded-lg font-semibold text-white" style={{ backgroundColor: themeColor }}>
                  Call Now
                </a>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 bg-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-4 space-y-4">
            <a href="#about" className="block text-gray-700 py-2">About</a>
            {servicesList.length > 0 && <a href="#services" className="block text-gray-700 py-2">Services</a>}
            {(galleryImages.length > 0 || galleryVideos.length > 0) && <a href="#gallery" className="block text-gray-700 py-2">Gallery</a>}
            {isProductStore && products.length > 0 && (
              <button onClick={() => setShowCart(true)} className="flex items-center gap-2 text-gray-700 py-2 w-full">
                <ShoppingCart className="w-5 h-5" />
                <span>Cart ({getCartCount()})</span>
              </button>
            )}
            {isMusicStore && musicTracks.length > 0 && <a href="#music" className="block text-gray-700 py-2">Music</a>}
            <a href="#contact" className="block text-gray-700 py-2">Contact</a>
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-white py-3 px-4 rounded-lg justify-center" style={{ backgroundColor: themeColor }}>
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </a>
            )}
          </div>
        )}
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden" style={{ 
          background: bannerUrl 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bannerUrl}) center/cover`
            : `linear-gradient(135deg, ${themeColor}, #00D4AA)`
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="max-w-6xl mx-auto px-4 py-32 relative z-10">
            <div className="max-w-2xl">
              {logoUrl && <img src={logoUrl} alt={displayName} className="h-20 w-auto mb-6" />}
              <h1 className="text-5xl font-bold text-white mb-4">{heroTitle}</h1>
              <p className="text-xl text-white/90 mb-6">{heroTagline}</p>
              <div className="flex gap-4">
                {phone && (
                  <a href={`tel:${phone}`} className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-gray-900">
                    Email Us
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        {aboutContent && (
          <section id="about" className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Us</h2>
              <div className="max-w-3xl mx-auto">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{aboutContent}</p>
              </div>
            </div>
          </section>
        )}

        {/* Services Section */}
        {servicesList.length > 0 && (
          <section id="services" className="py-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Services</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {servicesList.map((service, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${themeColor}20` }}>
                      <Settings className="w-6 h-6" style={{ color: themeColor }} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{service.trim()}</h3>
                    <p className="text-gray-600 text-sm">Professional services tailored to your needs.</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {(galleryImages.length > 0 || galleryVideos.length > 0) && (
          <section id="gallery" className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Gallery</h2>
              {galleryImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {galleryImages.map((img, i) => (
                    <div 
                      key={i} 
                      className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                      onClick={() => openLightbox('image', i, galleryImages)}
                    >
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {galleryVideos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {galleryVideos.map((vid, i) => (
                    <div 
                      key={i} 
                      className="aspect-video bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition relative"
                      onClick={() => openLightbox('video', i, galleryVideos)}
                    >
                      <video src={vid} controls className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Products Section - Show if isProductStore OR if there are products */}
        {(isProductStore || products.length > 0) && products.length > 0 && (
          <section id="products" className="py-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Products</h2>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                    <div className="aspect-square bg-gray-200 relative">
                      {/* Check for product images in multiple formats */}
                      {(() => {
                        const productImages = product.images || (product.image ? [product.image] : [])
                        const firstImage = productImages[0]
                        
                        return firstImage ? (
                          <img 
                            src={firstImage} 
                            alt={product.name} 
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openLightbox('image', 0, productImages)}
                            onError={(e) => {
                              // If image fails to load, show placeholder
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Package className="w-16 h-16 text-gray-400" />
                          </div>
                        )
                      })()}
                      {product.images?.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                          +{product.images.length} photos
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      <p className="text-2xl font-bold mb-3" style={{ color: themeColor }}>
                        ₦{typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${(product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                        {(product.stock || 0) > 0 && (
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2"
                            style={{ backgroundColor: themeColor }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Music Section */}
        {isMusicStore && musicTracks.length > 0 && (
          <section id="music" className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4">Latest Music</h2>
              <p className="text-center text-purple-200 mb-12">Stream and download our latest tracks</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {musicTracks.map((track: any) => (
                  <div key={track.id} className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                            <Music className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{track.title}</h3>
                        <p className="text-purple-200 text-sm truncate">{track.artist || displayName}</p>
                        <p className="text-purple-300 text-xs mt-1">{track.album || 'Single'}</p>
                      </div>
                    </div>
                    {track.audioUrl && (
                      <audio 
                        src={track.audioUrl} 
                        controls 
                        className="w-full h-10 rounded"
                        style={{ filter: 'hue-rotate(180deg)' }}
                      />
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-bold text-lg">
                        {track.price > 0 ? `₦${track.price.toLocaleString()}` : 'Free'}
                      </span>
                      {track.audioUrl && (
                        <a 
                          href={track.audioUrl} 
                          download={`${track.title}.mp3`}
                          className="px-4 py-2 bg-white text-purple-800 rounded-lg font-semibold text-sm hover:bg-purple-100 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {(ctaText || phone || email) && (
          <section className="py-20" style={{ backgroundColor: themeColor }}>
            <div className="max-w-4xl mx-auto px-4 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              {contactInfo && <p className="text-xl mb-8 opacity-90">{contactInfo}</p>}
              <a href={ctaLink} className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
                {ctaText || 'Contact Us Now'}
              </a>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Contact Us</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                {phone && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                      <Phone className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold">{phone}</p>
                    </div>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                      <Mail className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{email}</p>
                    </div>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                      <MapPin className="w-5 h-5" style={{ color: themeColor }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold">{address}</p>
                    </div>
                  </div>
                )}
              </div>
              <form className="bg-white p-8 rounded-2xl shadow-lg space-y-4">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3 border rounded-lg" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-3 border rounded-lg" />
                <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 border rounded-lg" />
                <button type="submit" className="w-full py-3 text-white rounded-lg font-semibold" style={{ backgroundColor: themeColor }}>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              {logoUrl && <img src={logoUrl} alt={displayName} className="h-12 mb-4" />}
              <h3 className="text-xl font-bold mb-2">{displayName}</h3>
              {tagline && <p className="text-gray-400 text-sm">{tagline}</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                {phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {phone}</p>}
                {email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {email}</p>}
                {address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {address}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                {socialLinks?.website && <a href={socialLinks.website} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600"><Globe className="w-5 h-5" /></a>}
                {socialLinks?.whatsapp && <a href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600"><svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>}
                {socialLinks?.twitter && <a href={socialLinks.twitter} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black"><Twitter className="w-5 h-5" /></a>}
                {socialLinks?.facebook && <a href={socialLinks.facebook} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600"><Facebook className="w-5 h-5" /></a>}
                {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600"><Instagram className="w-5 h-5" /></a>}
                {socialLinks?.tiktok && <a href={socialLinks.tiktok} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg></a>}
                {socialLinks?.snapchat && <a href={socialLinks.snapchat} target="_blank" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-yellow-400"><svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg></a>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button onClick={shareOnWhatsApp} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Powered by</h4>
                  <a href="https://bixfind.indevs.in" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                    <img src="/logo.png" alt="Bixfind" className="h-8" />
                    <span>Bixfind</span>
                  </a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {displayName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart ({getCartCount()})
              </h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 border-b pb-4">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-green-600 font-semibold">₦{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">₦{getCartTotal().toLocaleString()}</span>
                </div>
                <a
                  href={ctaLink}
                  className="block w-full py-3 text-center bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Contact Seller to Order
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox for Images/Videos */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center">
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
            <X className="w-8 h-8" />
          </button>
          
          <button onClick={prevItem} className="absolute left-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full">
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="max-w-5xl max-h-[80vh] mx-4">
            {lightbox.type === 'image' ? (
              <img 
                src={lightbox.items[lightbox.index]} 
                alt={`Image ${lightbox.index + 1}`} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video 
                src={lightbox.items[lightbox.index]} 
                controls 
                autoPlay 
                className="max-w-full max-h-[80vh]"
              />
            )}
          </div>
          
          <button onClick={nextItem} className="absolute right-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full">
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightbox.index + 1} / {lightbox.items.length}
          </div>
        </div>
      )}
      
      {/* WhatsApp Chat Button */}
      {(socialLinks?.whatsapp || phone) && (
        <button
          onClick={chatOnWhatsApp}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 flex items-center justify-center transition-transform hover:scale-110"
          title="Chat on WhatsApp"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
      )}
      
      {/* Chat Widget - floating button to chat with provider */}
      {website && (
        <ChatWidget 
          providerId={website.id || website.userId}
          providerName={displayName}
          providerAvatar={logoUrl}
        />
      )}
    </div>
  )
}

function Settings({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
