'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense, useRef } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { Star, Users, Zap, CheckCircle, Search, MapPin, ArrowRight, Shield, Clock, CreditCard, Menu, X, Loader2, Sparkles, Bell, LogOut, User, ExternalLink, MessageCircle, TrendingUp, Clock3, ThumbsUp, Phone, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'
import NotificationDropdown from '@/components/NotificationDropdown'
import { realtimeDb } from '@/lib/supabase'
import { FadeIn, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer, StaggerItem, HoverCard, PageTransition } from '@/components/animations'

const AnimatedHeroBackground = dynamic(() => import('@/components/AnimatedHeroBackground'), { ssr: false })
const InteractiveParticles = dynamic(() => import('@/components/InteractiveParticles'), { ssr: false })

// Lazy image loading component
const LazyImage = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={imgRef} className={className} style={style}>
      {!loaded && (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loaded ? '' : 'hidden'}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  )
}

const ServiceMap = dynamic(() => import('@/components/ServiceMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
})

const categories = [
  { name: 'Plumbing', icon: '🔧', color: 'from-blue-400 to-blue-600' },
  { name: 'Electrical', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
  { name: 'Cleaning', icon: '🧹', color: 'from-green-400 to-emerald-600' },
  { name: 'Painting', icon: '🎨', color: 'from-pink-400 to-rose-600' },
  { name: 'Car Repairs', icon: '🚗', color: 'from-red-400 to-red-600' },
  { name: 'Hair Salon', icon: '✂️', color: 'from-purple-400 to-violet-600' },
  { name: 'Tutoring', icon: '📚', color: 'from-indigo-400 to-blue-600' },
  { name: 'Fitness', icon: '💪', color: 'from-orange-400 to-red-500' },
]

// Service keywords for smart categorization - Nigerian-specific terms included
const serviceKeywords: Record<string, string[]> = {
  'Plumbing': ['plumb', 'pipe', 'water', 'drain', 'leak', 'bathroom', 'toilet', 'sink', 'faucet', 'borehole', 'water tank', 'gyser', 'geyser', 'plumber', 'fix water', 'blocked drain', 'shower', 'kitchen', 'bath'],
  'Electrical': ['electric', 'wiring', 'light', 'power', 'switch', 'socket', 'fan', 'ac', 'generator', 'inverter', 'solar', 'electrical', 'electrician', 'blown fuse', 'power outage', 'cctv', 'intercom', 'doorbell', ' rewiring', 'fitment', 'lightings', 'led', 'bulb', 'ceiling fan'],
  'Cleaning': ['clean', 'laundry', 'wash', 'dry clean', 'housekeep', 'janitor', 'disinfect', 'deep clean', 'carpet', 'post construction', 'post renovation', 'fumigation', 'pest control', 'maid', 'housemaid', 'wash clothes', 'ironing', 'laundry service', 'house cleaning', 'office cleaning', 'window cleaning'],
  'Painting': ['paint', 'wall', 'roller', 'brush', 'coat', 'texture', 'decoration', 'exterior', 'interior', 'spray paint', 'texture coat', 'pop ceiling', 'wallpaper', 'wall art', 'building painting', 'house painting', 'office painting', 'painter', 'building decorator'],
  'Car Repairs': ['car', 'auto', 'vehicle', 'mechanic', 'engine', 'tire', 'brake', 'battery', 'wheels', 'car wash', 'car service', 'car maintenance', 'vehicle repair', 'garage', 'panel beating', 'vulcanizing', 'exhaust', 'gear', 'clutch', 'car electrician', 'car ac', 'car rental', 'transport', 'logistics', 'driver', 'vehicle tracking', 'car tracking', 'tyres', 'rims'],
  'Hair Salon': ['hair', 'barber', 'salon', 'grooming', 'beauty', 'stylist', 'nail', 'spa', 'haircut', 'hairstyle', 'barbing', 'barbershop', 'plaiting', 'braids', 'weaving', 'hair treatment', 'hair dye', 'coloring', 'highlights', 'manicure', 'pedicure', 'makeup', 'make up', 'bridal makeup', 'gele', 'gele tying', 'bridal hair', 'wigs', 'hair extension', 'retouch', 'shampoo', 'conditioning'],
  'Tutoring': ['tutor', 'teach', 'lesson', 'class', 'coach', 'training', 'course', 'education', 'home lesson', 'home teacher', 'maths', 'math', 'english', 'physics', 'chemistry', 'biology', 'exam', 'waec', 'jamb', 'neco', 'gce', 'cbt', 'online class', 'skype lesson', 'home schooling', 'private lesson', 'tutorial', 'after school', 'cram', 'grinds', 'extra mural'],
  'Fitness': ['gym', 'fitness', 'trainer', 'workout', 'yoga', 'massage', 'health', 'personal trainer', 'sport', 'aerobics', 'cardio', 'weight loss', 'body building', 'muscle', 'gym instructor', 'yoga instructor', 'pilates', 'zumba', 'dancing', 'dance class', 'swimming', 'swim lessons', 'boxing', 'martial arts', 'karate', 'judo', 'taekwondo', 'wrestling', 'gym membership', 'fitness class'],
  'Catering': ['cater', 'catering', 'food', 'chef', 'cook', 'event', 'party', 'restaurant', 'small chops', 'snacks', 'drinks', 'buffet', 'birthday', 'wedding', 'ceremony', 'reception', 'graduation', ' owambe', 'party jollof', 'party rice', 'chicken', 'moi moi', 'peppered fish', 'cold drinks', 'cocktails', 'caterer', 'cookery', 'food vendor', 'food services'],
  'Photography': ['photo', 'photography', 'camera', 'video', 'wedding', 'event', 'shoot', 'studio', 'photographer', 'event coverage', 'portrait', 'passport photo', 'photo studio', 'photo album', 'digital photo', 'photo editing', 'photo printing', 'commercial photography', 'fashion photography', 'product photography', 'food photography', 'property photography', 'real estate photography', 'aerial photo', 'drone'],
  'Music': ['music', 'musician', 'dj', 'band', 'instrument', 'singer', 'audio', 'sound', 'dj', 'disc jockey', 'live band', 'live music', 'dj services', 'dj for party', 'mc', 'master of ceremony', 'comedian', 'comedy', 'entertainment', 'karaoke', 'music production', 'studio', 'recording', 'mixing', 'mastering', 'beat making', 'instrumentalist', 'guitarist', 'drummer', 'keyboardist', 'saxophonist'],
  'Fashion': ['fashion', 'clothing', 'design', 'tailor', 'sewing', 'boutique', 'dress', 'clothes', 'attire', 'agbada', 'aso oke', 'ankara', 'aso-oke', 'asoebi', 'native wear', 'traditional', 'wedding dress', 'bridal gown', 'suits', 'corporate wear', 'uniform', 'school uniform', ' embroidery', 'lace', 'ankara styles', 'blouse', 'skirt', 'shirt', 'trousers', ' alterations', 'dressmaking', 'seamstress', 'fashion designer'],
  'Tech': ['tech', 'computer', 'laptop', 'phone', 'software', 'web', 'app', 'IT', 'computer repair', 'phone repair', 'laptop repair', 'software development', 'web development', 'app development', 'graphic design', 'graphic designer', 'logo design', 'branding', 'social media', 'digital marketing', 'seo', 'content creation', 'cyber', 'hacking', 'data analysis', 'excel', 'database', 'network', 'server', 'cloud', 'hosting', 'domain', 'website', 'wordpress', 'shopify', 'mobile app'],
  'Real Estate': ['estate', 'real estate', 'property', 'house', 'land', 'apartment', 'rent', 'buy', 'sell', 'land for sale', 'house for sale', 'land for rent', 'house for rent', 'apartment for rent', ' duplex', 'bungalow', 'storey building', 'commercial property', 'office space', 'shop space', 'warehouse', 'estate agent', 'realtor', 'property management', 'valuation', 'survey', 'certificate of occupancy', 'gazette', 'development', 'building plan'],
  'Security': ['security', 'guard', 'cctv', 'camera', 'alarm', 'surveillance', 'safety', 'security guard', 'security company', 'bodyguard', 'bouncer', 'VIP protection', 'event security', 'fire alarm', 'fire extinguisher', 'access control', 'fingerprint', 'biometric', 'gate automation', 'electric fence', 'perimeter fence', 'security lights'],
  'Health': ['health', 'medical', 'doctor', 'nurse', 'clinic', 'hospital', 'pharmacy', 'healthcare', 'dentist', 'dental', 'optician', 'optometry', 'eye care', 'glasses', 'lab test', 'blood test', 'scan', 'xray', 'ultrasound', 'maternity', 'pregnancy', 'baby', 'pediatric', 'child health', 'mental health', 'therapy', 'counseling', 'psychologist', 'dermatologist', 'skin care', 'beauty clinic'],
  'Legal': ['legal', 'law', 'lawyer', 'attorney', 'court', 'consultation', 'solicitor', 'barrister', 'notary', 'legal services', 'contract', 'agreement', 'moa', 'mou', 'business registration', 'CAC', 'company name', 'trademark', 'intellectual property', 'will', 'trust', 'estate planning', 'divorce', 'family law', 'criminal law', 'civil law', 'litigation'],
  'Finance': ['finance', 'account', 'accountant', 'book', 'tax', 'accounting', 'bookkeeping', 'financial services', 'tax consultant', 'tax filing', 'audit', 'financial statement', 'payroll', 'salary', 'investment', 'trading', 'forex', 'crypto', 'banking', 'POS', 'POS machine', 'payment gateway', 'payment integration', ' Flutterwave', 'Paystack', 'Moniepoint'],
  'Events': ['event', 'events', 'party', 'wedding', 'celebration', 'occasion', 'event planner', 'event management', 'wedding planner', 'wedding coordination', 'wedding decorator', 'balloon decoration', 'chair cover', 'table decoration', 'backdrop', 'stage', 'sound system', 'public address', 'PA system', 'mc', 'host', 'emcee', 'celebrant', 'event stylist'],
  'Agriculture': ['farm', 'agriculture', 'farming', 'poultry', 'fish', 'livestock', 'crop', 'plant', 'harvest', 'agricultural', 'piggery', 'snail farming', 'fish farming', 'catfish', 'tilapia', 'chicken', 'layers', 'broilers', 'egg production', 'maize', 'rice', 'cassava', 'yam', 'vegetables', 'tomatoes', 'pepper', 'greenhouse', 'irrigation', 'fertilizer', 'seedlings'],
  'Printing': ['print', 'printing', 'printer', 'photocopy', 'print shop', 'press', 'printing press', 'business card', 'flyer', 'brochure', 'banner', 'signage', 'sign', 'sticker', 'label', 'magazine', 'book printing', 'novel', 'notebook', 'exercise book', 'receipt', 'invoice', 'document', 'offset printing', 'digital printing', 'large format', 'canvas print'],
  'Automobile': ['auto', 'automobile', 'car dealer', 'vehicle dealer', 'tokunbo', 'tokunbo car', 'uk used', 'usa used', 'car sales', 'car dealer', 'vehicle inspection', 'car inspection', 'mechanical inspection', 'automotive', 'tyres', 'rims', 'alloy wheels', 'car audio', 'car stereo', 'car entertainment', 'car alarm', 'car security', 'tracking device', 'GPS', 'vehicle GPS'],
  'Repair': ['repair', 'fix', 'maintenance', 'service', 'handyman', 'technician', 'appliance repair', 'fridge repair', 'freezer repair', ' AC repair', 'air conditioner repair', 'washing machine repair', 'tv repair', 'LCD repair', 'LED repair', 'plasma repair', 'generator repair', 'inverter repair', 'UPS repair', 'battery charger', 'electronic repair', 'gadget repair'],
  'Delivery': ['delivery', 'dispatch', 'courier', 'logistics', 'shipping', 'move', 'relocation', 'movers', 'pack', 'transport', 'delivery service', 'pickup', 'doorstep', 'same day delivery', 'express delivery', 'interstate', 'domestic', 'international', 'cargo', 'freight', 'moving company', 'relocation services', 'furniture moving', 'household moving', 'office moving'],
  'Interior': ['interior', 'interior design', 'furniture', 'furnishing', 'decor', 'decoration', 'home decor', 'office decor', 'furniture design', 'custom furniture', 'furniture maker', 'woodwork', 'carpenter', 'cabinet', 'wardrobe', 'kitchen cabinet', 'bed', 'sofa', 'dinning table', 'chair', 'interior decorator', 'space planning', 'renovation', 'building renovation'],
  'Gardening': ['garden', 'landscaping', 'lawn', 'grass', 'tree', 'outdoor', 'outdoors', 'landscape', 'hardscape', 'softscape', 'flowers', 'plants', 'shrubs', 'hedge', 'topiary', 'palm', 'flower bed', 'rock garden', 'pond', 'fountain', 'landscape design', 'garden design', 'garden maintenance', 'grass cutting', 'lawn mowing', 'tree pruning', 'tree felling', 'stump removal'],
  'Beauty': ['beauty', 'makeup', 'skincare', 'skin care', 'spa', 'wellness', 'facial', 'facial treatment', 'bleaching', 'skin lightening', 'acne treatment', 'anti-aging', 'body spa', 'body scrub', 'body massage', 'aromatherapy', 'hot stone', 'body wrap', 'nail art', 'nail technician', 'lash', 'lash extension', 'microblading', 'microblading artist', 'tattoo', 'piercing', 'henna', 'temporary tattoo'],
  'Education': ['education', 'school', 'tuition', 'academy', 'institute', 'training center', 'skill acquisition', 'vocational', 'technical', 'IT training', 'computer training', 'programming', 'coding', 'web development training', 'design training', 'digital skills', 'online course', 'certification', 'professional course', 'short course', 'seminar', 'workshop', 'conference', 'webinar'],
  'Sports': ['sport', 'sports', 'football', 'football academy', 'soccer', 'basketball', 'tennis', 'volleyball', 'badminton', 'table tennis', 'squash', 'swimming', 'athletics', 'track', 'field', 'gymnasium', 'sports academy', 'coaching', 'trainer', 'umpire', 'referee', 'sports equipment', 'sports wear', 'jersey', 'boots', 'cleats'],
  'Pet': ['pet', 'pets', 'dog', 'cat', 'bird', 'fish', 'pet care', 'pet shop', 'pet store', 'pet food', 'pet supplies', 'veterinary', 'vet', 'veterinarian', 'animal clinic', 'dog grooming', 'dog walking', 'pet sitting', 'pet boarding', 'kennel', 'pet daycare', 'pet training', 'dog trainer', 'pet accessories'],
  'Maintenance': ['maintenance', 'facility management', 'building maintenance', 'estate management', 'property maintenance', 'industrial maintenance', 'mechanical maintenance', 'electrical maintenance', 'preventive maintenance', 'corrective maintenance', 'maintenance technician', 'facility manager', 'estate manager', 'building manager', 'janitorial services', 'grounds maintenance', 'facility cleaning'],
  'Welding': ['weld', 'welding', 'welder', 'fabrication', 'metal work', 'steel work', 'iron work', 'gate', 'fence', 'railing', 'window', 'door', 'grill', 'burglary proof', 'security door', 'metal gate', 'sliding gate', 'swing gate', 'industrial welding', 'structural welding', 'pipe welding', 'aluminum welding', 'stainless steel', 'welding services'],
  'Glass': ['glass', 'glazing', 'window', 'glass work', 'glass repair', 'glass installation', 'double glazing', 'tempered glass', 'frosted glass', 'tinted glass', 'mirrors', 'mirror installation', 'shower glass', 'glass partition', 'office partition', 'sliding door', 'folding door', 'revolving door', 'automatic door', 'glass door'],
  'Roofing': ['roof', 'roofing', 'roof repair', 'roof installation', 'roofing sheet', 'zinc', 'aluminum roof', 'decra', 'long span', 'step tile', 'shingles', 'ceiling', ' POP ceiling', 'cornice', 'moulding', 'roofing contractor', 'roofing services', 'waterproofing', 'roof leak', 'roof maintenance', 'storm damage'],
  'Flooring': ['floor', 'flooring', 'tiles', 'tiling', 'ceramic', 'porcelain', 'marble', 'granite', 'wood floor', 'laminate', 'vinyl', 'carpet', 'floor installation', 'floor repair', 'tile installation', 'marble installation', 'hardwood floor', 'parquet', 'terrazzo', 'terrazzo flooring', 'floor polishing', 'floor maintenance'],
  'Fencing': ['fence', 'fencing', 'fence installation', 'fence repair', 'chain link', 'wire mesh', 'wooden fence', 'concrete fence', 'brick fence', 'metal fence', 'steel fence', 'security fence', 'electric fence', 'poultry fence', 'farm fence', 'estate fence', 'perimeter fence', 'fence post', 'fence gate', 'fence contractor'],
  'Solar': ['solar', 'solar panel', 'solar energy', 'photovoltaic', 'inverter', 'solar inverter', 'solar battery', 'solar power', 'solar installation', 'solar system', 'solar lights', 'solar street light', 'solar home system', 'solar water heater', 'solar charger', 'renewable energy', 'clean energy', 'off grid', 'on grid', 'solar contractor', 'solar company'],
  'DJ': ['dj', 'disc jockey', 'dj services', 'dj for party', 'dj for wedding', 'dj for event', 'club dj', 'party dj', 'wedding dj', 'corporate dj', 'live dj', 'dj equipment', 'sound system', 'speakers', 'amplifier', 'mixer', 'turntable', 'cdj', 'dj controller', 'dj booking', 'dj hire'],
}

const features = [
  { icon: Zap, title: 'Quick & Easy', desc: 'Find services in seconds with AI', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { icon: Users, title: 'Trusted Providers', desc: 'Verified professionals', color: 'text-green-500', bg: 'bg-green-100' },
  { icon: CheckCircle, title: 'Map View', desc: 'Find providers near you', color: 'text-blue-500', bg: 'bg-blue-100' },
  { icon: Bell, title: 'Push Notifications', desc: 'Get instant updates', color: 'text-purple-500', bg: 'bg-purple-100' },
]

const providerBenefits = [
  { icon: Shield, title: 'Verified & Trusted', desc: 'Every provider is vetted for quality and reliability', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
  { icon: Clock3, title: 'Fast Response', desc: 'Get replies within minutes, not hours', color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-600' },
  { icon: TrendingUp, title: 'Fair Pricing', desc: 'Transparent quotes with no hidden fees', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
  { icon: ThumbsUp, title: 'Satisfaction Guaranteed', desc: 'Not happy? Get your money back', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600' },
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [user, setUser] = useState<any>(() => {
    const u = storage.getUser()
    const t = storage.getToken()
    return (u && t) ? u : null
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [platformStats, setPlatformStats] = useState(() => {
    const cached = storage.get('platform_stats_cache')
    if (cached && cached.providers > 0) return cached
    return { users: 0, providers: 0, categories: 0, rating: '0.0' }
  })
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([])
  const [mapProviders, setMapProviders] = useState<any[]>([])

  // Fetch featured providers (Top Service Providers)
  useEffect(() => {
    let cancelled = false
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/featured-providers', { signal: AbortSignal.timeout(5000) })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setFeaturedProviders(data.providers || [])
      } catch {}
    }
    fetchFeatured()
    const interval = setInterval(fetchFeatured, 15_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Fetch map providers with locations
  useEffect(() => {
    let cancelled = false
    const fetchMapProviders = async () => {
      try {
        const res = await fetch('/api/map-providers', { signal: AbortSignal.timeout(8000) })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setMapProviders(data.providers || [])
      } catch {}
    }
    fetchMapProviders()
    const interval = setInterval(fetchMapProviders, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  // Fetch live stats from Supabase on mount and periodically
  useEffect(() => {
    let cancelled = false
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/platform/stats', { signal: AbortSignal.timeout(5000) })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data && typeof data.users === 'number') {
          setPlatformStats(data)
          storage.set('platform_stats_cache', data)
        }
      } catch {
        // Silent — stats cached from localStorage already shown
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentName, setCommentName] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [mounted, setMounted] = useState(false)

// Load providers on mount - FAST: cache first, then Supabase, then static
  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {}
      )
    }
  }, [])

  const submitComment = async () => {
    if (!newComment.trim() || !commentName.trim()) {
      toast.error('Please enter your name and comment')
      return
    }

    setSubmittingComment(true)
    try {
      const comment = {
        id: `comment_${Date.now()}`,
        name: commentName,
        text: newComment,
        approved: false,
        createdAt: new Date().toISOString()
      }

      // Save to Supabase
      await realtimeDb.push('comments', comment)
      
      // Also save locally
      const localComments = storage.get('platform_comments') || []
      storage.set('platform_comments', [...localComments, comment])

      toast.success('Comment submitted! It will appear after moderation.')
      setNewComment('')
      setCommentName('')
    } catch (error) {
      toast.error('Failed to submit comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  useEffect(() => {
    const currentUser = storage.getUser()
    const token = storage.getToken()
    if (currentUser && token) {
      setUser(currentUser)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    storage.clearUser()
    storage.clearToken()
    setUser(null)
    toast.success('Logged out successfully')
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserCoords(coords)
        setGettingLocation(false)
        toast.success('Location detected! Distance will be shown.')
      },
      (error) => {
        setGettingLocation(false)
        toast.error('Could not get your location. Please enable location services.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Auto-detect location on mount (only once)
  useEffect(() => {
    if (typeof window === 'undefined' || userCoords) return
    
    const autoDetect = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
          },
          () => {},
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        )
      }
    }
    
    // Delay to not interfere with initial load
    const timer = setTimeout(autoDetect, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const prefetch = async () => {
      const pages = ['/dashboard', '/login', '/signup', '/about']
      for (const page of pages) {
        try { await fetch(page, { method: 'HEAD' }) } catch {}
      }
    }
    const id = setTimeout(prefetch, 3000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setAiLoading(true)
    setShowResults(true)
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=15`, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const data = await res.json()
        const results = (data.items || []).map((r: any) => ({
          id: r.id,
          name: r.businessName || r.business_name,
          fullName: r.businessName || r.business_name,
          businessName: r.businessName || r.business_name,
          service: r.primaryCategory || r.category || '',
          category: r.primaryCategory || r.category || '',
          tagline: r.tagline || r.description || '',
          slug: r.slug || r.id,
          logoUrl: r.thumbnailUrl || r.logo_url || '',
          phone: r.phone || r.business_phone || '',
          city: r.city || '',
          state: r.state || '',
          address: r.address || '',
          rating: r.rating || 0,
          reviews: r.reviewCount || r.review_count || 0,
          isVerified: r.isVerified || false,
        }))
        setSearchResults(results)
        if (results.length > 0) {
          toast.success(`Found ${results.length} providers`)
        } else {
          toast.info('No providers found. Try a different search term.')
        }
      }
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // Smart search function with keyword expansion - using Nigerian-specific terms
  const smartSearch = (providers: any[], query: string): any[] => {
    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
    
    // Use the same keyword map as serviceKeywords (Nigerian-specific terms included)
    // Expand query with related keywords from all service categories
    let expandedWords = [...queryWords]
    queryWords.forEach(word => {
      // Check all serviceKeywords for matching categories
      for (const [category, keywords] of Object.entries(serviceKeywords)) {
        // If word is in keywords, add all keywords from that category
        if (keywords.includes(word) || category.toLowerCase().includes(word) || word.includes(category.toLowerCase())) {
          expandedWords = [...expandedWords, ...keywords]
          break
        }
      }
    })
    
    // Nigerian variations: Pidgin English, Yoruba, Igbo, Hausa, and local slang
    const nigerianVariations: Record<string, string[]> = {
      // --- Pidgin English ---
      'chop': ['food', 'cooking', 'catering', 'restaurant', 'eating', 'chef', 'vendor'],
      'chop money': ['finance', 'accounting', 'tax', 'investment', 'banking'],
      'wahala': ['repair', 'maintenance', 'handyman', 'technician', 'fix', 'trouble'],
      'abeg': ['delivery', 'dispatch', 'logistics', 'transport', 'help'],
      'how far': ['consultation', 'advice', 'counseling', 'health', 'doctor'],
      'no wahala': ['cleaning', 'laundry', 'washing', 'housekeeping'],
      'ajebutter': ['fashion', 'clothing', 'boutique', 'designer', 'luxury'],
      'gbas gbos': ['entertainment', 'music', 'dj', 'party', 'event'],
      'omo': ['beauty', 'salon', 'spa', 'makeup', 'skincare'],
      'omo se': ['security', 'guard', 'protection', 'safety'],
      'aje': ['money', 'finance', 'accounting', 'business', 'wealth'],
      'waka': ['transport', 'travel', 'logistics', 'delivery', 'dispatch'],
      'bend down': ['construction', 'building', 'plumbing', 'electrical'],
      'panel beater': ['car repair', 'auto', 'mechanic', 'vehicle repair', 'bodywork'],
      'vulcanize': ['tyre', 'tire', 'car repair', 'wheel', 'wheel alignment'],
      'okada': ['transport', 'motorcycle', 'bike', 'delivery'],
      'danfo': ['transport', 'bus', 'vehicle', 'logistics'],
      'keke': ['transport', 'tricycle', 'vehicle', 'delivery'],
      'agbero': ['entertainment', 'comedy', 'mc', 'party', 'event'],
      'owambe': ['party', 'event', 'wedding', 'celebration', 'catering', 'aso-oke', 'asoebi', 'ceremony', 'small chops', 'jollof', 'nigerian food'],
      'spray': ['event', 'party', 'wedding', 'celebration', 'music'],
      'aso oke': ['fashion', 'clothing', 'wedding', 'traditional', 'fabric', 'textile'],
      'asoebi': ['fashion', 'clothing', 'wedding', 'ceremony', 'uniform', 'fabric'],
      'gele': ['hair', 'salon', 'beauty', 'bridal', 'gele tying', 'headgear', 'fashion'],
      'jollof': ['rice', 'food', 'party', 'catering', 'nigerian food', 'cooking'],
      'fried rice': ['food', 'catering', 'cooking', 'restaurant', 'nigerian food'],
      'moi moi': ['food', 'catering', 'cooking', 'nigerian food', 'beans'],
      'pepper soup': ['food', 'catering', 'cooking', 'restaurant', 'nigerian food'],
      'suya': ['food', 'catering', 'cooking', 'street food', 'meat', 'grill'],
      'small chops': ['catering', 'finger food', 'snacks', 'nibbles', 'cocktail', 'party food'],
      'puff puff': ['food', 'snacks', 'nigerian food', 'cooking', 'pastries'],
      'banga': ['food', 'soup', 'nigerian food', 'cooking', 'palm fruit'],
      'efo riro': ['food', 'soup', 'nigerian food', 'cooking', 'vegetable soup'],
      'amala': ['food', 'soup', 'nigerian food', 'cooking', 'yam flour'],
      'eba': ['food', 'nigerian food', 'cooking', 'garri', 'swallow'],
      'fufu': ['food', 'nigerian food', 'cooking', 'cassava', 'swallow'],
      'pounded yam': ['food', 'nigerian food', 'cooking', 'yam', 'swallow'],

      // --- Yoruba terms ---
      'ile': ['house', 'home', 'real estate', 'property', 'rent', 'apartment'],
      'ile ise': ['office', 'commercial property', 'business space', 'workspace'],
      'onise': ['provider', 'artisan', 'tradesman', 'professional', 'technician'],
      'adura': ['prayer', 'spiritual', 'consultation', 'traditional', 'healing'],
      'osho': ['herbal', 'traditional medicine', 'herbalist', 'natural healing'],
      'omo onile': ['real estate', 'property', 'house', 'land', 'agent'],
      'omo bata': ['shoe', 'footwear', 'fashion', 'leather', 'cobbler'],
      'alaso': ['fashion', 'fabric', 'textile', 'clothing', 'material'],
      'omoge': ['beauty', 'salon', 'makeup', 'fashion', 'spa'],
      'omo ode': ['security', 'guard', 'protection', 'hunting'],
      'agbo': ['herbal', 'medicine', 'health', 'traditional', 'wellness'],
      'onile': ['real estate', 'property', 'land', 'house'],
      'ise': ['work', 'job', 'service', 'labor', 'craft'],
      'oja': ['market', 'shop', 'store', 'trading', 'commerce'],
      'agbe': ['farming', 'agriculture', 'farming', 'crop', 'harvest'],
      'ole': ['theft', 'security', 'lock', 'key', 'safety'],
      'aaro': ['electricity', 'power', 'light', 'solar', 'generator'],
      'omi': ['water', 'plumbing', 'borehole', 'water supply'],
      'ina': ['fire', 'cooking', 'gas', 'kitchen', 'catering'],
      'igbo': ['wood', 'timber', 'furniture', 'carpentry', 'construction'],
      'okuta': ['stone', 'gravel', 'construction', 'building', 'cement'],
      'afefe': ['air conditioning', 'cooling', 'ventilation', 'fan'],
      'oju riri': ['internet', 'web', 'digital', 'online', 'technology'],
      'esan': ['travel', 'transport', 'logistics', 'delivery'],
      'eja': ['fish', 'food', 'seafood', 'cooking', 'catering'],
      'eyan': ['people', 'human', 'care', 'health', 'nursing'],
      'abaya': ['fashion', 'clothing', 'modest', 'Islamic fashion', 'dress'],

      // --- Igbo terms ---
      'ubi': ['farming', 'agriculture', 'farm', 'crop', 'harvest'],
      'ahia': ['market', 'shop', 'trading', 'store', 'commerce'],
      'nka': ['craft', 'skill', 'artisan', 'handwork', 'trade'],
      'ndu': ['life', 'health', 'medical', 'wellness', 'care'],
      'ezzu': ['construction', 'building', 'masonry', 'cement'],
      'ogbugbu': ['cleaning', 'washing', 'laundry', 'housekeeping'],
      'nri': ['food', 'cooking', 'catering', 'restaurant', 'meal'],
      'akpa': ['bag', 'leather', 'fashion', 'accessories', 'handbag'],
      'akpụkpọ': ['wood', 'timber', 'furniture', 'carpentry'],
      'ụgbọala': ['car', 'vehicle', 'automobile', 'transport'],
      'ụlọ': ['house', 'home', 'building', 'property', 'real estate'],
      'oge': ['time', 'event', 'party', 'celebration', 'wedding'],
      'egwú': ['music', 'dance', 'entertainment', 'dj', 'band'],
      'nká': ['art', 'design', 'graphics', 'creative', 'photography'],
      'azụzị': ['buying', 'shopping', 'procurement', 'import', 'supply'],
      'ọrụ': ['work', 'job', 'service', 'business', 'labor'],
      'ụzọ': ['road', 'transport', 'logistics', 'travel'],
      'ike': ['strength', 'power', 'energy', 'electricity', 'generator'],
      'ogo': ['money', 'finance', 'payment', 'banking', 'cash'],
      'mma': ['knife', 'blade', 'cutting', 'barber', 'salon', 'tailoring'],
      'okpoko': ['hammer', 'construction', 'building', 'carpentry'],
      'ngwa': ['device', 'gadget', 'phone', 'electronics', 'equipment'],
      'akwụkwọ': ['book', 'education', 'school', 'training', 'learning'],
      'nnyocha': ['cleaning', 'inspection', 'audit', 'quality'],
      'mkpọsa': ['polish', 'shine', 'cleaning', 'beauty', 'spa'],
      'sị': ['sewing', 'tailor', 'fashion', 'clothing', 'design'],

      // --- Hausa terms ---
      'kasuwa': ['market', 'shop', 'trading', 'store', 'commerce'],
      'dakin': ['room', 'house', 'apartment', 'property', 'real estate'],
      'makyan': ['barber', 'salon', 'hair', 'grooming', 'barbing'],
      'wanka': ['wash', 'cleaning', 'laundry', 'bath'],
      'kiyaye': ['farming', 'agriculture', 'farm', 'crop', 'livestock'],
      'sanaa': ['craft', 'artisan', 'skill', 'trade', 'handwork'],
      'kaya': ['goods', 'load', 'transport', 'logistics', 'moving'],
      'otobello': ['carpenter', 'furniture', 'wood', 'carpentry'],
      'kwalba': ['shoe', 'footwear', 'leather', 'cobbler', 'fashion'],
      'riga': ['clothing', 'fashion', 'fabric', 'dress', 'attire'],
      'gas': ['cooking', 'fuel', 'kitchen', 'catering', 'energy'],
      'jirgi': ['vehicle', 'car', 'transport', 'mechanic', 'engine'],
      'inji': ['machine', 'generator', 'equipment', 'mechanical'],
      'iskanci': ['electricity', 'power', 'solar', 'light', 'energy'],
      'ruwa': ['water', 'plumbing', 'borehole', 'water supply'],
      'gonaki': ['farming', 'garden', 'agriculture', 'horticulture'],
      'lafiya': ['health', 'medical', 'doctor', 'hospital', 'pharmacy'],
      'basin': ['bus', 'transport', 'vehicle', 'logistics'],
      'hula': ['cap', 'hat', 'fashion', 'clothing', 'accessories'],
      'zare': ['cloth', 'fabric', 'textile', 'fashion', 'material'],
      'dawa': ['millet', 'food', 'agriculture', 'grain', 'crop'],
      'taki': ['manure', 'fertilizer', 'agriculture', 'farming'],
      'rari': ['cutting', 'chop', 'wood', 'carpentry', 'timber'],

      // --- Local slang / cross-cultural ---
      'tokunbo': ['used', 'car', 'vehicle', 'foreign used', 'uk used', 'usa used', 'tokunboh', ' fairly used'],
      'bend down boutique': ['fashion', 'clothing', 'second hand', 'thrift', 'fairly used', 'used clothes'],
      'buka': ['food', 'restaurant', 'cooking', 'catering', 'local food', 'mama put'],
      'mama put': ['food', 'cooking', 'restaurant', 'catering', 'local food', 'buka'],
      'boli': ['food', 'snacks', 'roasted', 'yam', 'plantain'],
      'roasted corn': ['food', 'snacks', 'street food', 'corn'],
      'bole': ['food', 'roasted', 'yam', 'plantain', 'snacks'],
      'kilishi': ['food', 'meat', 'snacks', 'dried', 'hausa food'],
      'fura da nono': ['food', 'milk', 'drink', 'hausa food', 'traditional'],
      'zobo': ['drink', 'beverage', 'hibiscus', 'nigerian drink'],
      'kunu': ['drink', 'beverage', 'grain drink', 'hausa drink'],
      'palm wine': ['drink', 'bar', 'palm', 'alcohol', 'social'],
      'burukutu': ['drink', 'brew', 'traditional', 'local drink'],
      'ogogoro': ['drink', 'gin', 'traditional', 'local drink', 'alcohol'],
      'borehole': ['water', 'plumbing', 'drilling', 'well', 'water supply', 'boring'],
      'solar': ['energy', 'power', 'panel', 'inverter', 'renewable', 'electricity', 'sun'],
      'inverter': ['power', 'electricity', 'battery', 'solar', 'ups', 'energy', 'backup'],
      'ac': ['air conditioning', 'cooling', 'refrigeration', 'hvac', 'aircon'],
      'cctv': ['camera', 'security', 'surveillance', 'monitoring', 'safety'],
      'pos': ['payment', 'transaction', 'banking', 'flutterwave', 'paystack', 'transfer'],
      'cac': ['registration', 'business', 'company', 'legal', 'incorporation', 'business name'],
      'gesy': ['geyser', 'water', 'heating', 'plumbing', 'bath', 'heater'],
      'gyser': ['geyser', 'water', 'heating', 'plumbing', 'bath', 'heater'],
      'pop': ['ceiling', 'construction', 'finishing', 'interior', 'design', 'plaster'],
      'plaster': ['painting', 'wall', 'finishing', 'construction', 'building', 'surface'],
      'landscaping': ['garden', 'lawn', 'grass', 'tree', 'outdoor', 'landscape'],
      'fumigation': ['pest control', 'cleaning', 'disinfect', 'spray', 'insecticide'],
      'tailoring': ['fashion', 'sewing', 'dress', 'clothing', 'design', 'stitching'],
      'barbing': ['barber', 'haircut', 'salon', 'barbershop', 'grooming', 'shave', 'fade', 'hair'],
      'wiring': ['electric', 'electrical', 'electrician', 'installation', 'wiring'],
      'plumbing': ['plumb', 'pipe', 'water', 'drain', 'leak', 'bathroom'],
      'welding': ['weld', 'fabrication', 'metal', 'steel', 'iron', 'gate', 'fence'],
      'tutoring': ['tutor', 'teach', 'lesson', 'class', 'coaching', 'education', 'learning'],
      'catering': ['cater', 'food', 'chef', 'cooking', 'event', 'party', 'restaurant'],
      'photography': ['photo', 'camera', 'video', 'shoot', 'studio', 'portrait', 'wedding'],
      'consulting': ['consultant', 'advice', 'business', 'strategy', 'management'],
      'laundry': ['wash', 'dry clean', 'iron', 'cleaning', 'press', 'clothes'],
      'masonry': ['brick', 'block', 'cement', 'construction', 'building'],
      'tiling': ['tile', 'floor', 'ceramic', 'marble', 'flooring'],
      'roofing': ['roof', 'ceiling', 'sheet', 'zinc', 'aluminum', 'protection'],
      'fencing': ['fence', 'gate', 'wall', 'perimeter', 'security', 'boundary'],
      'borehole drilling': ['water', 'borehole', 'drilling', 'well', 'pump', 'water supply'],
    }
    
    queryWords.forEach(word => {
      if (nigerianVariations[word]) {
        expandedWords = [...expandedWords, ...nigerianVariations[word]]
      }
    })
    
    // Remove duplicates
    expandedWords = [...new Set(expandedWords)]
    
    // Get category from first query word
    const primaryCategory = queryWords[0]
    
    // Score each provider - STRICT FILTERING
    const scoredProviders = providers.map(provider => {
      let score = 0
      
      // Skip providers without actual service/niche
      const providerService = provider.service || provider.category || provider.niche || ''
      const providerServiceLower = providerService.toLowerCase()
      
      // Skip if no meaningful service is set
      if (!providerService || providerService === 'service provider' || providerService.startsWith('service_')) {
        return { provider, score: -1, isValid: false }
      }
      
      // Build comprehensive search fields including services array
      const servicesArray = Array.isArray(provider.services) ? provider.services : []
      const servicesContent = provider.sectionContent?.servicesContent || ''
      
      const searchFields = [
        provider.fullName, provider.businessName, provider.companyName, provider.displayName,
        provider.category, provider.service, provider.serviceType, provider.niche, 
        provider.specialization, provider.tags,
        provider.email, provider.phone, provider.address,
        ...servicesArray, // Include services array for search
        servicesContent,
        provider.sectionContent?.heroTitle, provider.sectionContent?.heroTagline,
        provider.sectionContent?.aboutContent,
        provider.tagline, provider.about, provider.description,
      ].filter(Boolean).join(' ').toLowerCase()
      
      // Check if provider matches the search category
      let categoryMatch = false
      let matchCount = 0
      
      expandedWords.forEach(word => {
        // Exact match
        if (searchFields.includes(word)) {
          score += 15
          matchCount++
          categoryMatch = true
        }
        // Plural/singular match
        else if (searchFields.includes(word + 's') || searchFields.includes(word.slice(0, -1))) {
          score += 12
          matchCount++
          categoryMatch = true
        }
        // Partial match - only for words >= 5 chars, require meaningful substring (word boundary)
        else if (word.length >= 5) {
          const shortPart = word.slice(0, 5)
          const wordBoundaryRegex = new RegExp(`\\b\\w*${shortPart}\\w*\\b`, 'i')
          if (wordBoundaryRegex.test(searchFields)) {
            score += 5
            matchCount++
            categoryMatch = true
          }
        }
      })
      
      // Must have category match to be included
      if (!categoryMatch) {
        return { provider, score: -1, isValid: false }
      }
      
      // Bonus for exact category match
      const catLower = (provider.category || '').toLowerCase()
      if (catLower.includes(queryLower) || catLower === primaryCategory) {
        score += 25
      }
      
      // Bonus for services array match
      servicesArray.forEach((svc: string) => {
        if (queryWords.some(qw => svc.toLowerCase().includes(qw) || qw.includes(svc.toLowerCase().substring(0, 4)))) {
          score += 10
        }
      })
      
      // Bonus for exact match in name
      const nameLower = (provider.fullName || provider.businessName || provider.displayName || '').toLowerCase()
      if (nameLower.includes(queryLower)) {
        score += 20
      }
      
      // Bonus for published status
      if (provider.isPublished) {
        score += 5
      }
      
      return { provider, score: score + matchCount, isValid: true }
    })
    
    // Filter out invalid providers (score -1)
    const validProviders = scoredProviders.filter(p => p.isValid && p.score > 0)
    
    // Sort by score first
    validProviders.sort((a, b) => b.score - a.score)
    
    // Deduplicate by provider ID or slug - keep highest scored version
    const seen = new Set()
    const uniqueProviders: any[] = []
    
    for (const item of validProviders) {
      const key = item.provider.id || item.provider.companyName || item.provider.fullName
      if (!seen.has(key)) {
        seen.add(key)
        uniqueProviders.push(item.provider)
      }
    }
    
    return uniqueProviders
  }

  const handleAISearch = async () => {
    if (!searchTerm.trim()) return
    
    setAiLoading(true)
    setShowResults(true)
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=15`, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const data = await res.json()
        const results = (data.items || []).map((r: any) => ({
          id: r.id,
          name: r.businessName || r.business_name,
          fullName: r.businessName || r.business_name,
          businessName: r.businessName || r.business_name,
          service: r.primaryCategory || r.category || '',
          category: r.primaryCategory || r.category || '',
          tagline: r.tagline || r.description || '',
          slug: r.slug || r.id,
          logoUrl: r.thumbnailUrl || r.logo_url || '',
          phone: r.phone || r.business_phone || '',
          city: r.city || '',
          state: r.state || '',
          rating: r.rating || 0,
          reviews: r.reviewCount || 0,
        }))
        setSearchResults(results)
        if (results.length > 0) {
          toast.success(`Found ${results.length} providers`)
        } else {
          toast.info('No providers found. Try different keywords.')
        }
      } else {
        toast.error('Search failed. Please try again.')
      }
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }
  
  const fetchMoreProviders = async (search: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}&limit=30`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        const moreResults = (data.items || []).map((r: any) => ({
          id: r.id,
          name: r.businessName || r.business_name,
          fullName: r.businessName || r.business_name,
          businessName: r.businessName || r.business_name,
          service: r.primaryCategory || r.category || '',
          category: r.primaryCategory || r.category || '',
          tagline: r.tagline || r.description || '',
          slug: r.slug || r.id,
          logoUrl: r.thumbnailUrl || r.logo_url || '',
          phone: r.phone || r.business_phone || '',
          city: r.city || '',
          state: r.state || '',
          address: r.address || '',
          rating: r.rating || 0,
          reviews: r.reviewCount || 0,
          isVerified: r.isVerified || false,
        }))
        if (moreResults.length > 0) {
          setSearchResults(prev => [...prev, ...moreResults].slice(0, 30))
        }
      }
    } catch (e) {
      // Silent fail - static data already shown
    }
  }

const handleCategoryClick = async (category: string) => {
    setSearchTerm('')
    setShowResults(true)
    setSelectedCategory(category)
    setAiSuggestion('')
    setAiLoading(true)
    setSearchResults([])
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(category)}&category=${encodeURIComponent(category)}&limit=15`, { signal: AbortSignal.timeout(10000) })
      if (res.ok) {
        const data = await res.json()
        const results = (data.items || []).map((r: any) => ({
          id: r.id,
          name: r.businessName || r.business_name,
          fullName: r.businessName || r.business_name,
          businessName: r.businessName || r.business_name,
          service: r.primaryCategory || r.category || '',
          category: r.primaryCategory || r.category || '',
          tagline: r.tagline || r.description || '',
          slug: r.slug || r.id,
          logoUrl: r.thumbnailUrl || r.logo_url || '',
          phone: r.phone || r.business_phone || '',
          city: r.city || '',
          state: r.state || '',
          rating: r.rating || 0,
          reviews: r.reviewCount || 0,
        }))
        setSearchResults(results)
        if (results.length > 0) {
          toast.success(`Found ${results.length} ${category} providers`)
        } else {
          toast.info(`No ${category} providers found.`)
        }
      }
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }
  
  const fetchMoreByCategory = async (category: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(category)}&category=${encodeURIComponent(category)}&limit=30`, { signal: AbortSignal.timeout(5000) })
      if (res.ok) {
        const data = await res.json()
        const providers = (data.items || []).map((r: any) => ({
          id: r.id,
          name: r.businessName || r.business_name,
          fullName: r.businessName || r.business_name,
          businessName: r.businessName || r.business_name,
          service: r.primaryCategory || r.category || '',
          category: r.primaryCategory || r.category || '',
          tagline: r.tagline || r.description || '',
          slug: r.slug || r.id,
          logoUrl: r.thumbnailUrl || r.logo_url || '',
          phone: r.phone || r.business_phone || '',
          city: r.city || '',
          state: r.state || '',
          address: r.address || '',
          rating: r.rating || 0,
          reviews: r.reviewCount || 0,
          isVerified: r.isVerified || false,
        }))
        if (providers.length > 0) {
          setSearchResults(prev => [...prev, ...providers].slice(0, 30))
        }
      }
    } catch (e) {
      // Silent fail
    }
}
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
              <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" loading="eager" />
              <span className={`text-3xl font-bold transition-colors ${isScrolled ? 'text-blue-600' : 'text-white'}`}>BIXFIND</span>
            </a>
            
            <div className="hidden md:flex gap-8 items-center">
              <a href="#categories" className={`hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>Services</a>
              <Link href="/about" className={`hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>About</Link>
              <Link href="/support" className={`hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>Support</Link>
              <Link href="/contact" className={`hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>Contact</Link>
              {user && (
                <Link href="/chat" className={`hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                  <MessageCircle className="w-5 h-5" />
                </Link>
              )}
              {user && (
                <div className={`relative hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                  <NotificationDropdown />
                </div>
              )}
            </div>
            
            <div className="flex gap-4 items-center">
              {user ? (
                <>
                  {(() => {
                    const userType = user.user_metadata?.user_type || user.userType
                    return (
                      <Link href={userType === 'admin' ? '/admin/overview' : userType === 'provider' ? '/provider/today' : '/dashboard'} className={`hidden md:flex items-center gap-2 hover:text-blue-600 font-semibold transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                        <User className="w-5 h-5" />
                        {user.user_metadata?.full_name || user.fullName || user.email || 'User'}
                      </Link>
                    )
                  })()}
                  <button
                    onClick={handleLogout}
                    className={`hidden md:flex items-center gap-2 hover:text-red-600 font-semibold transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={`hidden md:block hover:text-blue-600 font-semibold transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all">
                    Sign Up
                  </Link>
                </>
              )}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X className={isScrolled ? 'text-gray-700' : 'text-white'} /> : <Menu className={isScrolled ? 'text-gray-700' : 'text-white'} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 md:hidden z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
          >
            <div className="flex flex-col gap-2">
              <a href="#categories" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition">
                Services
              </a>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition">
                About
              </Link>
              <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition">
                Support
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition">
                Contact
              </Link>
              {user && (
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Link>
              )}
              {user && (
                <div className="border-t pt-2 mt-2">
                  {(() => {
                    const userType = user.user_metadata?.user_type || user.userType
                    return (
                      <Link href={userType === 'admin' ? '/admin/overview' : userType === 'provider' ? '/provider/today' : '/dashboard'} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.user_metadata?.full_name || user.fullName || user.email || 'User'}
                      </Link>
                    )
                  })()}
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-medium transition text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
              {!user && (
                <div className="border-t pt-2 mt-2 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition text-center">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition text-center">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Interactive Particle Network */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0a0e27]">
        {/* Interactive Particle Background */}
        <InteractiveParticles
          particleCount={100}
          connectionDistance={180}
          mouseDistance={250}
          colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#6366f1', '#22d3ee', '#a855f7']}
          speed={0.3}
        />

        {/* Ambient gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27]/80 via-[#0f1736]/50 to-[#0a0e27]/90 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Content */}
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-24 relative z-10 text-center">
          {/* Trust Badge */}
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
          >
            Find Every Service,{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Everywhere
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Connect with verified professionals in your area. From home repairs to personal care
            <span className="text-white/90 font-medium"> book in seconds</span>, not hours.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-3 max-w-3xl mx-auto border border-white/10"
          >
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="flex-1 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What service do you need? (e.g., plumber, electrician, cleaner)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && searchTerm.trim()) handleAISearch() }}
                  className="w-full outline-none text-white bg-transparent placeholder:text-white/40"
                />
                {aiLoading && <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />}
              </div>
              <button
                onClick={() => {
                  if (searchTerm.trim()) {
                    handleAISearch()
                  } else {
                    toast.error('Please enter a search term')
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-5 h-5" />
                Search
              </button>
            </div>
          </motion.div>

          {/* Quick Category Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            <span className="text-white/50 text-sm">Popular:</span>
            {['Plumber', 'Electrician', 'Cleaner', 'AC Repair', 'Beauty'].map((tag, i) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSearchTerm(tag); }}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:text-white transition-colors"
              >
                {tag}
              </motion.button>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-12"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white/70 text-sm">100% Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-white/70 text-sm">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white/70 text-sm">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span className="text-white/70 text-sm">Secure Payment</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Search Results Section */}
      {showResults && (
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedCategory ? `${selectedCategory} Providers` : `Results for "${searchTerm || selectedCategory}"`}
                </h2>
                <p className="text-gray-600 mt-1">
                  {searchResults.length > 0 ? `${searchResults.length} provider${searchResults.length === 1 ? '' : 's'} found` : 'No results found'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm || selectedCategory)}`}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition text-sm font-medium"
                >
                  View full results
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => { setShowResults(false); setSearchTerm(''); setSelectedCategory(''); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </motion.div>

            {searchResults.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl shadow-lg"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-500 mb-6">Try different keywords or browse our categories below</p>
                <button
                  onClick={() => { setShowResults(false); }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium"
                >
                  Browse Categories
                </button>
              </motion.div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((provider, idx) => {
                  const services = Array.isArray(provider.services) ? provider.services :
                    (provider.sectionContent?.servicesContent?.split('\n').filter((s: string) => s.trim()) || [])
                  const providerService = provider.service || provider.category || services[0] || 'Service Provider'
                  const providerName = provider.name || provider.fullName || provider.businessName || provider.displayName || 'Provider'
                  const providerRating = provider.rating || 4.5
                  const providerReviews = provider.reviews || 0

                  return (
                    <StaggerItem key={provider.id || idx}>
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-xl shadow-md overflow-hidden group cursor-pointer h-full flex flex-col"
                      >
                        <div className="p-5 flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                              {provider.logoUrl ? (
                                <img src={provider.logoUrl} alt={providerName} className="w-full h-full object-cover" loading="lazy" />
                              ) : provider.avatar?.startsWith('http') ? (
                                <img src={provider.avatar} alt={providerName} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                provider.avatar || providerName.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{providerName}</h3>
                              <p className="text-sm text-blue-600 truncate">{providerService}</p>
                            </div>
                          </div>

                          {provider.tagline && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.tagline}</p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-3">
                            {services.slice(0, 3).map((svc: string, i: number) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                {typeof svc === 'string' ? svc.trim() : svc}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-gray-900">{providerRating}</span>
                            <span className="text-sm text-gray-500">({providerReviews})</span>
                          </div>
                        </div>

                        <div className="px-5 pb-5 flex gap-2">
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone}`}
                              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition text-sm"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          )}
                          <Link
                            href={provider.slug ? `/p/${provider.slug}` : `/p/${provider.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Profile
                          </Link>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-50" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StaggerItem className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.users > 0 ? `${platformStats.users}+` : '0'}
              </div>
              <div className="text-gray-600 font-medium">Active Users</div>
            </StaggerItem>
            <StaggerItem className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.providers > 0 ? `${platformStats.providers}+` : '0'}
              </div>
              <div className="text-gray-600 font-medium">Service Providers</div>
            </StaggerItem>
            <StaggerItem className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.categories || '0'}
              </div>
              <div className="text-gray-600 font-medium">Service Categories</div>
            </StaggerItem>
            <StaggerItem className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-1">
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
                {parseFloat(platformStats.rating) > 0 ? platformStats.rating : '0.0'}
              </div>
              <div className="text-gray-600 font-medium">Average Rating</div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Top Service Providers Section */}
      {featuredProviders.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <FadeIn>
              <div className="text-center mb-10">
                <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">Featured</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Top Service Providers</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">Handpicked by our admin team for exceptional quality and reliability</p>
              </div>
            </FadeIn>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.map((provider) => (
                <StaggerItem key={provider.id || provider.slug}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden group cursor-pointer h-full flex flex-col border border-gray-100"
                  >
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                          {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            provider.name?.charAt(0) || 'P'
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{provider.name}</h3>
                            <span className="inline-flex items-center gap-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <Star className="w-3 h-3 fill-current" />
                              Featured
                            </span>
                          </div>
                          <p className="text-sm text-blue-600 truncate">{provider.service || 'Service Provider'}</p>
                        </div>
                      </div>

                      {provider.tagline && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.tagline}</p>
                      )}

                      {provider.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-gray-900">{provider.rating}</span>
                          <span className="text-sm text-gray-500">({provider.reviews || 0})</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="px-5 pb-5 flex gap-2">
                      {provider.phone && (
                        <a
                          href={`tel:${provider.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition text-sm"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      )}
                      {provider.slug ? (
                        <Link
                          href={`/p/${provider.slug}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visit Website
                        </Link>
                      ) : provider.phone ? (
                        <a
                          href={`tel:${provider.phone}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition text-sm"
                        >
                          <Phone className="w-4 h-4" />
                          Call Now
                        </a>
                      ) : null}
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* Providers Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-10">
              <span className="inline-block bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">Near You</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Find Providers on the Map</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Locate verified service providers near you in real-time</p>
            </div>
          </FadeIn>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden shadow-xl border border-gray-200"
          >
            <ServiceMap
              providers={mapProviders}
              center={[6.5244, 3.3792]}
              zoom={12}
              height="450px"
              autoLocate={true}
            />
          </motion.div>
          <p className="text-center text-sm text-gray-500 mt-4">
            <MapPin className="w-4 h-4 inline mr-1" />
            {mapProviders.length > 0
              ? `Showing ${mapProviders.length} verified provider${mapProviders.length !== 1 ? 's' : ''} across Nigeria`
              : 'Map loads providers with registered locations'}
          </p>
        </div>
      </section>

      {/* Why Choose Bixfind Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Bixfind</span>?
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              We're dedicated to connecting you with the best service providers in your area
            </p>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <StaggerItem key={idx}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center h-full"
                >
                  <motion.div 
                    className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>



      {/* Comments/Reviews Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">Reviews</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What People Say About Bixfind</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what users and providers are saying about our platform
            </p>
          </div>

          {/* Comments Display */}
          {comments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {comments.map((comment, idx) => (
                <div key={comment.id || idx} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {comment.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{comment.name}</h4>
                      <p className="text-xs text-gray-500">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-10">
              <p className="text-gray-500">No reviews yet. Be the first to leave a comment!</p>
            </div>
          )}

          {/* Add Comment Form */}
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with Bixfind..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={submitComment}
                disabled={submittingComment}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                {submittingComment ? 'Submitting...' : 'Submit Review'}
              </button>
              <p className="text-xs text-gray-500 text-center">Your review will appear after moderation</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-blue-200 max-w-2xl mx-auto">
              Get the service you need in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search', desc: 'AI finds the best providers', icon: Search },
              { step: '2', title: 'Map', desc: 'View providers near you', icon: MapPin },
              { step: '3', title: 'Book', desc: 'Book instantly & get notified', icon: Bell },
            ].map((item, idx) => (
              <div key={idx} className="text-center relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 hover:scale-110 transition-transform">
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-blue-200">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <motion.div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl opacity-10" animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20" animate={{ x: [0, -40, 0], y: [0, 40, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        
        <motion.div 
          className="max-w-4xl mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of customers and providers on Bixfind today</p>
          {!user && (
            <motion.div 
              className="flex gap-4 justify-center flex-col md:flex-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.a 
                href="/signup?type=customer"
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(255, 255, 255, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign Up as Customer
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a 
                href="/signup?type=provider"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Become a Provider
                <Users className="w-5 h-5" />
              </motion.a>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Bixfind Logo" className="h-10 w-10" loading="lazy" />
                <span className="text-2xl font-bold">BIXFIND</span>
              </div>
              <p className="text-gray-400">Find Every Service, Every Provider, Everywhere</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <div className="space-y-3 text-gray-400">
                <Link href="/about" className="block hover:text-white transition">About Us</Link>
                <Link href="/contact" className="block hover:text-white transition">Contact</Link>
                <Link href="/support" className="block hover:text-white transition">Support</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Providers</h4>
              <div className="space-y-3 text-gray-400">
                <Link href="/signup?type=provider" className="block hover:text-white transition">Become a Provider</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="https://wa.me/1234567890" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <span className="text-xl">💬</span>
                </a>
                <a href="https://t.me/bixfind_support" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <span className="text-xl">✈️</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bixfind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
