'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense, useRef } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import { Star, Users, Zap, CheckCircle, Search, MapPin, ArrowRight, Shield, Clock, CreditCard, Menu, X, Quote, Loader2, Sparkles, Bell, LogOut, User, ExternalLink, Share2, Twitter, Facebook, MessageCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { storage } from '@/lib/storage'
import NotificationDropdown from '@/components/NotificationDropdown'
import { realtimeDb } from '@/lib/realtime'

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

const testimonials = [
  { name: 'Customer', role: 'User', rating: 5, text: 'Great platform for finding reliable service providers in Nigeria!', avatar: '👩' },
  { name: 'Business Owner', role: 'Provider', rating: 5, text: 'Bixfind has helped me grow my business significantly. The platform is intuitive and effective.', avatar: '👨' },
  { name: 'Freelancer', role: 'Provider', rating: 5, text: 'I found clients easily through this platform. Highly recommended!', avatar: '👩' },
]

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '10K+', label: 'Service Providers' },
  { value: '25', label: 'Service Categories' },
  { value: '4.9', label: 'Average Rating' },
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [featuredProviders, setFeaturedProviders] = useState<any[]>(() => {
    // Load cached providers immediately for instant display
    const cached = storage.get('cached_providers') || []
    return cached.slice(0, 8)
  })
  const [providersLoading, setProvidersLoading] = useState(false) // Start as false - we have cache

  // Debounce ref to prevent multiple rapid fetches
  const lastFetchTime = { current: 0 }
  const isFetching = { current: false }
  const [platformStats, setPlatformStats] = useState(() => {
    // Load cached stats immediately for instant display
    const cached = storage.get('platform_stats_cache')
    if (cached) return cached
    // Default to known platform stats (50 users, 271 sites) while loading
    return { users: 50, providers: 271, categories: 25, rating: '4.5' }
  })
  const [sharingProvider, setSharingProvider] = useState<string | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentName, setCommentName] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

// Load providers on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setProvidersLoading(false)
      return
    }

    // Static fallback data (works offline)
    const loadStaticData = () => {
      const providerData = [
        { id: 'site_1', name: 'Adesew Pharmacy', service: 'Pharmacy', phone: '9071093349', tagline: 'Your Trusted Pharmacy', rating: 4.5, reviews: 28, avatar: '💊' },
        { id: 'site_2', name: 'DGG Royal World', service: 'Fashion', phone: '+2347064742219', tagline: 'Quality fashion', rating: 4.8, reviews: 45, avatar: '👗' },
        { id: 'site_3', name: 'Mickeygee Signature', service: 'Hair Salon', phone: '08102228687', tagline: 'Professional haircuts', rating: 4.7, reviews: 62, avatar: '💇' },
        { id: 'site_4', name: 'Oyinz Cut Barbing', service: 'Barber', phone: '08132633626', tagline: 'Best barbershop', rating: 4.6, reviews: 38, avatar: '✂️' },
        { id: 'site_5', name: 'Mercy Catering', service: 'Catering', phone: '+2349023139837', tagline: 'Delicious meals', rating: 4.9, reviews: 51, avatar: '🍽️' },
        { id: 'site_6', name: 'Eliza Makeup', service: 'Makeup', phone: '+2349032983748', tagline: 'Professional makeup', rating: 4.8, reviews: 73, avatar: '💄' },
        { id: 'site_7', name: 'Abidoye Fashion', service: 'Fashion', phone: '+2348140303344', tagline: 'Custom designs', rating: 4.7, reviews: 29, avatar: '👘' },
        { id: 'site_8', name: 'Onawoga Electrical', service: 'Electrical', phone: '+2348143928243', tagline: 'Expert electrician', rating: 4.5, reviews: 18, avatar: '⚡' },
        { id: 'site_9', name: 'Abeeb Shisha', service: 'Hookah', phone: '', tagline: 'Hookah services', rating: 4.3, reviews: 12, avatar: '💨' },
        { id: 'site_10', name: 'Olaleye Painting', service: 'Painting', phone: '+2439059631539', tagline: 'Professional painting', rating: 4.6, reviews: 24, avatar: '🎨' },
        { id: 'site_11', name: 'Hammed Car Repairs', service: 'Car Repairs', phone: '+2347014465534', tagline: 'Expert mechanics', rating: 4.7, reviews: 41, avatar: '🚗' },
        { id: 'site_12', name: 'Ishola Lateef', service: 'Car Repairs', phone: '+2348107238024', tagline: 'Car specialists', rating: 4.8, reviews: 56, avatar: '🔧' }
      ]
      
      setFeaturedProviders(providerData)
      storage.set('cached_providers', providerData)
      
      const stats = { users: 50, providers: 271, categories: 25, rating: '4.5' }
      setPlatformStats(stats)
      storage.set('platform_stats_cache', stats)
      setProvidersLoading(false)
    }

    // Try Supabase first, then static
    const loadData = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('../lib/supabase')
        if (isSupabaseConfigured()) {
          const { data: websites } = await supabase.getWebsites()
          if (websites?.length > 0) {
            setFeaturedProviders(websites.slice(0, 12))
            setPlatformStats({ users: 50, providers: websites.length, categories: 25, rating: '4.5' })
            setProvidersLoading(false)
            return
          }
        }
      } catch (e) {}
      loadStaticData()
    }

    loadData()
    
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

    // Direct Firebase REST API fetch (bypasses SDK issues)
    const loadFromFirebaseAPI = async () => {
      try {
        console.log('Homepage: Fetching from Firebase REST API...')
        
        // Fetch websiteIndex
        const indexRes = await Promise.all([
          fetch('https://bixfind-3055a-default-rtdb.firebaseio.com/websiteIndex.json'),
          fetch('https://bixfind-3055a-default-rtdb.firebaseio.com/users.json')
        ])
        
        const indexData = indexRes[0].ok ? await indexRes[0].json() : null
        const usersData = indexRes[1].ok ? await indexRes[1].json() : null
        
        console.log('Homepage: websiteIndex keys:', indexData ? Object.keys(indexData).length : 0)
        console.log('Homepage: users keys:', usersData ? Object.keys(usersData).length : 0)
        
        if (!indexData) {
          console.log('Homepage: No data from websiteIndex')
          return
        }
        
        const allSites = Object.values(indexData) as any[]
        
        console.log('Homepage: Total sites:', allSites.length)
        
        // Filter sites with VALID content (has companyName or displayName with real content)
        const validSites = allSites.filter((w: any) => {
          const name = (w.companyName || w.displayName || '').trim()
          const hero = (w.heroTitle || '').trim()
          const category = (w.category || '').trim()
          // Must have a meaningful name (at least 3 chars) or heroTitle or category
          return name.length >= 3 || hero.length >= 3 || (category.length >= 3 && category !== 'Service Provider')
        })
        
        console.log('Homepage: Valid sites with content:', validSites.length)
        
        // Count providers and users
        const providers = validSites.length
        const totalUsers = usersData ? Object.keys(usersData).length : providers + 20
        
        // Update stats
        const newStats = {
          providers: providers,
          users: totalUsers,
          categories: 25,
          rating: '4.5'
        }
        setPlatformStats(newStats)
        storage.set('platform_stats_cache', newStats)
        
        // Transform to providers - show up to 12
        const fbProviders = validSites.slice(0, 12).map((w: any, i: number) => ({
          id: w.id || w.siteId || `site_${i}`,
          userId: w.userId || '',
          slug: (w.companyName || w.displayName || 'provider')?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          companyName: w.companyName || w.displayName,
          displayName: w.displayName || w.companyName,
          name: w.displayName || w.companyName || 'Provider',
          service: w.category || 'Service Provider',
          services: w.services || [],
          tagline: w.heroTitle || '',
          heroTitle: w.heroTitle || '',
          rating: w.rating || 4.5,
          reviews: w.reviews || Math.floor(Math.random() * 50) + 5,
          avatar: w.logoUrl || w.logo || ['🔧', '⚡', '🧹', '🎨', '🚗', '💇', '📚', '💪'][i % 8],
          banner: w.bannerUrl || w.banner || '',
          phone: w.phone || '',
          email: w.email || '',
          address: w.address || '',
          hasWebsite: true,
          isWebsitePublished: w.isPublished,
          isPublished: w.isPublished,
          hasProfile: true,
          products: w.products || [],
          sectionContent: w.sectionContent || {}
        }))
        
        if (fbProviders.length > 0) {
          setFeaturedProviders(fbProviders)
          storage.set('cached_providers', fbProviders)
          console.log('Homepage: Showing', fbProviders.length, 'providers')
        }
} catch (e) {
        console.error('Homepage: Firebase fetch error:', e)
      }
    }
    
    loadFromFirebaseAPI()
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

      // Save to Firebase
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

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Format distance for display
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m away`
    }
    return `${km.toFixed(1)}km away`
  }

  // Get directions URL for Google Maps
  const getDirectionsUrl = (provider: any): string => {
    if (provider.lat && provider.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${provider.lat},${provider.lng}`
    }
    if (provider.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(provider.address)}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ' ' + provider.address)}`
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

  const shareToWhatsApp = (provider: any) => {
    const url = `https://bixfind.indevs.in/profile-site/${provider.slug}`
    const text = `Check out ${provider.name} - ${provider.tagline || provider.service}\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareToTwitter = (provider: any) => {
    const url = `https://bixfind.indevs.in/profile-site/${provider.slug}`
    const text = `Check out ${provider.name} - ${provider.tagline || provider.service}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareToFacebook = (provider: any) => {
    const url = `https://bixfind.indevs.in/profile-site/${provider.slug}`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const copyLink = async (provider: any) => {
    const url = `https://bixfind.indevs.in/profile-site/${provider.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const toggleShareMenu = (providerId: string) => {
    setSharingProvider(sharingProvider === providerId ? null : providerId)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setAiLoading(true)
    setShowResults(true)
    
    // Get all providers from all sources
    let allProviders: any[] = []
    
    // 1. From localStorage websites
    const localWebsites = storage.getMiniWebsites() || []
    const currentWebsite = storage.getCurrentWebsite()
    if (currentWebsite) localWebsites.unshift(currentWebsite)
    allProviders = [...localWebsites]
    
    // 2. From API users
    try {
      const response = await axios.get('https://api-eal2ibekhq-uc.a.run.app/users')
      if (response.data?.users) {
        const users = Array.isArray(response.data.users) ? response.data.users : Object.values(response.data.users)
        users.forEach((u: any) => {
          if (u.userType === 'provider' && !allProviders.find(p => p.id === u.id)) {
            allProviders.push(u)
          }
        })
      }
    } catch (e) {}
    
    // 3. From API websites (using lightweight summary endpoint)
    try {
      const webResponse = await axios.get('https://api-eal2ibekhq-uc.a.run.app/websites/summary')
      if (webResponse.data?.websites) {
        const websites = Array.isArray(webResponse.data.websites) ? webResponse.data.websites : Object.values(webResponse.data.websites)
        websites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}
    
    // 4. From Firebase
    try {
      const fbData = await realtimeDb.get('websites')
      if (fbData) {
        const fbWebsites = Object.values(fbData)
        fbWebsites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}

    // Deduplicate all providers first - remove duplicates from all sources
    const seenAll = new Set()
    allProviders = allProviders.filter(p => {
      const key = p.id || p.userId || p.companyName || p.fullName
      if (seenAll.has(key)) return false
      seenAll.add(key)
      return true
    })
    
    const searchResults = smartSearch(allProviders, searchTerm)
    
    if (searchResults.length > 0) {
      setSearchResults(searchResults.slice(0, 15))
      toast.success(`Found ${searchResults.length} providers`)
    } else {
      setSearchResults([])
      toast.info('No providers found. Try a different search term.')
    }
    
    setAiLoading(false)
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
    
    // Also add common Nigerian variations
    const nigerianVariations: Record<string, string[]> = {
      'barbing': ['barber', 'haircut', 'salon', 'barbershop', 'grooming', 'shave', 'fade'],
      'owambe': ['party', 'event', 'wedding', 'celebration', 'catering', 'aso-oke', 'asoebi', 'ceremony', 'small chops', 'jollof', 'nigerian food'],
      'tokunbo': ['used', 'car', 'vehicle', 'foreign used', 'uk used', 'usa used'],
      'small chops': ['catering', 'finger food', 'snacks', 'nibbles', 'cocktail'],
      'jollof': ['rice', 'food', 'party', 'catering', 'nigerian food'],
      'borehole': ['water', 'plumbing', 'drilling', 'well', 'water supply'],
      'solar': ['energy', 'power', 'panel', 'inverter', 'renewable', 'electricity'],
      'inverter': ['power', 'electricity', 'battery', 'solar', 'ups', 'energy'],
      'plaster': ['painting', 'wall', 'finishing', 'construction', 'building'],
      'pop': ['ceiling', 'construction', 'finishing', 'interior', 'design'],
      'carpenter': ['wood', 'furniture', 'furnishing', 'woodwork', 'joinery'],
      'seamstress': ['tailor', 'sewing', 'dress', 'clothing', 'fashion'],
      'ac': ['air conditioning', 'cooling', 'refrigeration', 'hvac'],
      'cctv': ['camera', 'security', 'surveillance', 'monitoring'],
      'pos': ['payment', 'transaction', 'banking', 'flutterwave', 'paystack'],
      'cac': ['registration', 'business', 'company', 'legal', 'incorporation'],
      'gesy': ['geyser', 'water', 'heating', 'plumbing', 'bath'],
      'gyser': ['geyser', 'water', 'heating', 'plumbing', 'bath'],
      'frying': ['food', 'catering', 'cooking', 'vendor'],
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
        // Partial match (word contained in field)
        else if (searchFields.includes(word.slice(0, 3))) {
          score += 5
          matchCount++
          categoryMatch = true
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
    
    // Get all providers from all sources
    let allProviders: any[] = []
    
    // 1. From localStorage
    const localWebsites = storage.getMiniWebsites() || []
    const currentWebsite = storage.getCurrentWebsite()
    if (currentWebsite) localWebsites.unshift(currentWebsite)
    allProviders = [...localWebsites]
    
    // 2. From API users
    try {
      const usersResponse = await axios.get('https://api-eal2ibekhq-uc.a.run.app/users')
      if (usersResponse.data?.users) {
        const users = Array.isArray(usersResponse.data.users) ? usersResponse.data.users : Object.values(usersResponse.data.users)
        users.forEach((u: any) => {
          if (u.userType === 'provider' && !allProviders.find(p => p.id === u.id)) {
            allProviders.push(u)
          }
        })
      }
    } catch (e) {}
    
    // 3. From API websites (using lightweight summary endpoint)
    try {
      const webResponse = await axios.get('https://api-eal2ibekhq-uc.a.run.app/websites/summary')
      if (webResponse.data?.websites) {
        const websites = Array.isArray(webResponse.data.websites) ? webResponse.data.websites : Object.values(webResponse.data.websites)
        websites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}
    
    // 4. From Firebase
    try {
      const fbData = await realtimeDb.get('websites')
      if (fbData) {
        const fbWebsites = Object.values(fbData)
        fbWebsites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}
    
    // Smart search
    const searchResults = smartSearch(allProviders, searchTerm)
    
    if (searchResults.length > 0) {
      setSearchResults(searchResults.slice(0, 15))
      toast.success(`Found ${searchResults.length} providers for "${searchTerm}"`)
    } else {
      setSearchResults([])
      toast.info('No providers found. Try different keywords.')
    }
    
    setAiLoading(false)
  }

  const handleCategoryClick = async (category: string) => {
    setSearchTerm('')
    setShowResults(true)
    setSelectedCategory(category)
    setAiSuggestion('')
    
    // Get providers from all sources (like search)
    let allProviders: any[] = []
    
    // 1. From localStorage
    const localWebsites = storage.getMiniWebsites() || []
    const currentWebsite = storage.getCurrentWebsite()
    if (currentWebsite) localWebsites.unshift(currentWebsite)
    allProviders = [...localWebsites]
    
    // 2. From API users
    try {
      const response = await axios.get('https://api-eal2ibekhq-uc.a.run.app/users')
      if (response.data?.users) {
        const users = Array.isArray(response.data.users) ? response.data.users : Object.values(response.data.users)
        users.forEach((u: any) => {
          if (u.userType === 'provider' && !allProviders.find(p => p.id === u.id)) {
            allProviders.push(u)
          }
        })
      }
    } catch (e) {}
    
    // 3. From API websites (using lightweight summary endpoint)
    try {
      const webResponse = await axios.get('https://api-eal2ibekhq-uc.a.run.app/websites/summary')
      if (webResponse.data?.websites) {
        const websites = Array.isArray(webResponse.data.websites) ? webResponse.data.websites : Object.values(webResponse.data.websites)
        websites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}
    
    // 4. From Firebase
    try {
      const fbData = await realtimeDb.get('websites')
      if (fbData) {
        const fbWebsites = Object.values(fbData)
        fbWebsites.forEach((w: any) => {
          if (!allProviders.find(p => p.id === w.id)) {
            allProviders.push(w)
          }
        })
      }
    } catch (e) {}
    
    // Deduplicate all providers first - remove duplicates from all sources
    const seenAllCat = new Set()
    allProviders = allProviders.filter(p => {
      const key = p.id || p.userId || p.companyName || p.fullName
      if (seenAllCat.has(key)) return false
      seenAllCat.add(key)
      return true
    })
    
    // Filter by category using keyword matching - check all website info
    const categoryLower = category.toLowerCase()
    const categoryKeywords: Record<string, string[]> = {
      'Plumbing': ['plumb', 'pipe', 'water', 'drain', 'leak', 'bathroom', 'toilet', 'sink', 'faucet', 'gas', 'heating', 'boiler', 'water heater', 'fix', 'repair'],
      'Electrical': ['electric', 'wiring', 'light', 'power', 'switch', 'socket', 'fan', 'ac', 'generator', 'inverter', 'solar', 'electrical', ' electrician'],
      'Cleaning': ['clean', 'laundry', 'wash', 'dry clean', 'housekeep', 'janitor', 'disinfect', 'deep clean', 'carpet', 'upholstery', 'maid', 'sanitation'],
      'Painting': ['paint', 'wall', 'roller', 'brush', 'coat', 'texture', 'decoration', 'interior', 'exterior', 'spray', 'renovate'],
      'Car Repairs': ['car', 'auto', 'vehicle', 'mechanic', 'engine', 'tire', 'brake', 'battery', 'wheels', 'oil', 'transmission', 'car repair', 'vehicle repair', 'garage', 'motors'],
      'Hair Salon': ['hair', 'barber', 'salon', 'grooming', 'beauty', 'stylist', 'nail', 'spa', 'hairstyle', 'cut', 'trim', 'hairstyling', 'barbing'],
      'Tutoring': ['tutor', 'teach', 'lesson', 'class', 'coach', 'training', 'course', 'education', 'tutoring', 'exam', 'science', 'math', 'teacher'],
      'Fitness': ['gym', 'fitness', 'trainer', 'workout', 'yoga', 'massage', 'health', 'personal trainer', 'sport', 'gym', 'workout', 'aerobics'],
    }
    
    const keywords = categoryKeywords[category] || [categoryLower]
    const matchedProviders = allProviders.filter((p: any) => {
      // Build comprehensive search fields from ALL provider info
      const searchFields = [
        // Basic info
        p.category, p.service, p.serviceType, p.niche,
        p.businessName, p.fullName, p.companyName, p.displayName,
        // Website content
        p.servicesContent, p.sectionContent?.servicesContent,
        p.aboutContent, p.sectionContent?.aboutContent,
        p.heroTitle, p.heroTagline, p.tagline,
        // Products/services offered
        ...(Array.isArray(p.services) ? p.services : []),
        ...(Array.isArray(p.products) ? p.products.map((pr: any) => pr.name + ' ' + pr.description) : []),
        // Any other field that might have service info
        p.description, p.bio, p.specialization,
        // Company name variations
        p.companyName?.replace(/-/g, ' '),
      ].filter(Boolean).join(' ').toLowerCase()
      
      // Check for exact category match first
      const providerCategory = (p.category || '').toLowerCase()
      if (providerCategory === categoryLower) return true
      
      // Check service/niche
      const providerService = (p.service || p.serviceType || p.niche || '').toLowerCase()
      if (providerService === categoryLower) return true
      
      // Check partial matches
      if (providerCategory.includes(categoryLower) || categoryLower.includes(providerCategory)) return true
      
      // Check if any keyword matches
      return keywords.some(kw => searchFields.includes(kw))
    })
    
    // Deduplicate
    const seen = new Set()
    const uniqueProviders: any[] = []
    for (const p of matchedProviders) {
      const key = p.id || p.userId || p.companyName
      if (!seen.has(key)) {
        seen.add(key)
        uniqueProviders.push(p)
      }
    }
    
    if (uniqueProviders.length > 0) {
      setSearchResults(uniqueProviders.slice(0, 15))
      toast.success(`Found ${uniqueProviders.length} ${category} providers`)
    } else {
      setSearchResults([])
      toast.info(`No ${category} providers found.`)
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
              <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
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
                <button className={`relative hover:text-blue-600 transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                  <NotificationDropdown />
                </button>
              )}
            </div>
            
            <div className="flex gap-4 items-center">
              {user ? (
                <>
                  <Link href={user.userType === 'admin' ? '/admin/dashboard' : user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'} className={`hidden md:flex items-center gap-2 hover:text-blue-600 font-semibold transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                    <User className="w-5 h-5" />
                    {user.fullName}
                  </Link>
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
                  <Link href="/auth/login" className={`hidden md:block hover:text-blue-600 font-semibold transition ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all">
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

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#categories" className="block text-gray-700 hover:text-blue-600">Services</a>
              <Link href="/about" className="block text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/support" className="block text-gray-700 hover:text-blue-600">Support</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-blue-600">Contact</Link>
              {user ? (
                <>
                  <Link href={user.userType === 'admin' ? '/admin/dashboard' : user.userType === 'provider' ? '/provider-dashboard' : '/dashboard'} className="block text-blue-600 font-semibold">
                    {user.fullName}
                  </Link>
                  <div className="flex gap-4 pt-2 border-t">
                    <Link href="/chat" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat</span>
                    </Link>
                    <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </button>
                  </div>
                  <button onClick={handleLogout} className="block text-red-600 font-semibold w-full text-left">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block text-blue-600 font-semibold">Sign In</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto px-4 py-32 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">AI-Powered Service Search</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Every Service,<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Every Provider
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover and book services from verified professionals in your area. From home maintenance to personal care.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto transform hover:scale-[1.02] transition-transform">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                  className="w-full outline-none text-gray-900 bg-transparent"
                />
                {aiLoading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full outline-none text-gray-900 bg-transparent"
                  />
                  {gettingLocation && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                </div>
                <button
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition"
                  title="Use my location"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={handleAISearch}
                disabled={aiLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                AI Search
              </button>
            </div>
            {aiSuggestion && (
              <p className="text-sm text-blue-600 mt-2 ml-1">{aiSuggestion}</p>
            )}
          </div>

          {/* Toggle Map */}
          <div className="flex justify-center mt-4">
            <button 
              onClick={() => setShowMap(!showMap)}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full font-semibold hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              {showMap ? 'Hide' : 'Show'} Map
            </button>
          </div>

          {/* Map Section */}
          {showMap && (
            <div className="mt-8 max-w-4xl mx-auto">
              <ServiceMap 
                providers={featuredProviders}
                center={[6.5244, 3.3792]}
                zoom={12}
                height="400px"
                autoLocate={true}
              />
            </div>
          )}

          {/* Search Results - Only show when searching, not when browsing categories */}
          {showResults && searchTerm && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {searchTerm ? `Results for "${searchTerm}"` : 'Browse Results'}
                  </div>
                  <span className="text-white text-sm">({searchResults.length} {searchResults.length === 1 ? 'provider' : 'providers'} found)</span>
                </div>
                <button 
                  onClick={() => {
                    setShowResults(false)
                    setSearchTerm('')
                    setAiSuggestion('')
                  }}
                  className="text-white/70 hover:text-white flex items-center gap-1"
                >
                  <X className="w-5 h-5" />
                  Clear
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((provider) => {
                    const providerSlug = provider.companyName || provider.fullName?.toLowerCase().replace(/\s+/g, '-') || provider.id
                    const providerName = provider.fullName || provider.displayName || provider.businessName || provider.name
                    
                    // Get service/category - use transform logic
                    const services = provider.sectionContent?.servicesContent?.split('\n').filter((s: string) => s.trim()) || 
                                     provider.services || []
                    const providerService = provider.category || services[0] || provider.serviceType || 'Service Provider'
                    
                    // Calculate distance
                    const distance = userCoords && provider.lat && provider.lng
                      ? calculateDistance(userCoords.lat, userCoords.lng, provider.lat, provider.lng)
                      : null
                    
                    return (
                    <div key={provider.id} className="bg-white rounded-xl p-4 hover:shadow-lg transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {provider.logoUrl ? (
                              <img src={provider.logoUrl} alt="" className="w-full h-full object-cover" />
                            ) : provider.avatar ? (
                              <img src={provider.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-7 h-7 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 truncate">{providerName}</h4>
                            <p className="text-sm text-blue-600 font-medium">{providerService}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {provider.address && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{provider.address}</p>
                              )}
                              {distance !== null && distance < 500 && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  <MapPin className="w-3 h-3" />
                                  {formatDistance(distance)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {distance !== null && distance < 500 && (provider.lat || provider.address) && (
                            <a
                              href={getDirectionsUrl(provider)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-semibold flex items-center gap-1"
                              title="Get directions"
                            >
                              Directions
                            </a>
                          )}
                          <Link 
                            href={`/profile-site/${providerSlug}`}
                            target="_blank"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit
                          </Link>
                          {user && (
                            <button 
                              onClick={() => {
                                const url = `https://bixfind.indevs.in/profile-site/${providerSlug}`
                                window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${providerName} - ${url}`)}`, '_blank')
                              }}
                              className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm font-semibold"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <p className="text-gray-600">No providers found. Try searching for a different service or provider name.</p>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons - Hide when logged in */}
          {!user && (
            <div className="flex gap-4 justify-center mt-8 flex-col md:flex-row">
              <Link href="/auth/signup?type=customer" className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                Get Started as Customer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/signup?type=provider" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                Become a Provider
                <Users className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.users > 0 ? `${platformStats.users}+` : '0'}
              </div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.providers > 0 ? `${platformStats.providers}+` : '0'}
              </div>
              <div className="text-gray-600">Service Providers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {platformStats.categories}
              </div>
              <div className="text-gray-600">Service Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {parseFloat(platformStats.rating) > 0 ? platformStats.rating : '0'}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Why Choose Bixfind?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We're dedicated to connecting you with the best service providers in your area
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Providers */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">Featured</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Top Service Providers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most highly-rated and trusted service providers in your area
            </p>
          </div>
          {providersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : featuredProviders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md p-8">
              <div className="text-6xl mb-4">🌐</div>
              <p className="text-gray-500 mb-4 text-lg">No mini websites found yet.</p>
              <p className="text-gray-400 mb-6">Providers can create beautiful mini websites to showcase their services.</p>
              <Link href="/auth/signup?type=provider" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition">
                Become a Provider
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProviders.map((provider, idx) => {
                const distance = userCoords && provider.lat && provider.lng 
                  ? calculateDistance(userCoords.lat, userCoords.lng, provider.lat, provider.lng) 
                  : null
                
                // Get proper service/category
                const services = provider.sectionContent?.servicesContent?.split('\n').filter((s: string) => s.trim()) || 
                                 provider.services || []
                const providerService = provider.service || services[0] || 'Service Provider'
                
                return (
                <div key={provider.id || idx} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Banner Image or gradient */}
                  {provider.banner ? (
                    <div className="h-20 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                      <img src={provider.banner} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="h-20 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                        {provider.logoUrl ? (
                          <img src={provider.logoUrl} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : provider.avatar?.startsWith('http') ? (
                          <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          provider.avatar
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{provider.name}</h3>
                        <p className="text-sm text-blue-600 truncate">{providerService}</p>
                      </div>
                    </div>
                    
                    {/* Distance badge */}
                    {distance !== null && distance < 500 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {formatDistance(distance)}
                        </span>
                        <a
                          href={getDirectionsUrl(provider)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Get directions
                        </a>
                      </div>
                    )}
                    
                    {/* Tagline */}
                    {provider.tagline && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{provider.tagline}</p>
                    )}
                    
                    {/* Services preview */}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {services.slice(0, 3).map((svc: string, i: number) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            {svc.trim()}
                          </span>
                        ))}
                        {services.length > 3 && (
                          <span className="text-xs text-gray-500">+{services.length - 3} more</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-gray-900">{provider.rating}</span>
                        <span className="text-sm text-gray-500">({provider.reviews})</span>
                      </div>
                    </div>
                    
                    {/* Visit Website Button - ONLY show if provider has PUBLISHED website */}
                    {(provider.hasWebsite || provider.isWebsitePublished) && (
                      <Link 
                        href={`/profile-site/${provider.slug}`}
                        target="_blank"
                        className="w-full mb-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Visit Website
                      </Link>
                    )}
                    
                    {/* Share Button */}
                    <div className="relative">
                      <button 
                        onClick={() => toggleShareMenu(provider.id || idx)}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      
                      {/* Share Dropdown */}
                      {sharingProvider === (provider.id || idx) && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border py-2 z-10">
                          <button 
                            onClick={() => { shareToWhatsApp(provider); setSharingProvider(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-green-50 text-green-700"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </button>
                          <button 
                            onClick={() => { shareToTwitter(provider); setSharingProvider(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-700"
                          >
                            <Twitter className="w-4 h-4" />
                            Twitter
                          </button>
                          <button 
                            onClick={() => { shareToFacebook(provider); setSharingProvider(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-800"
                          >
                            <Facebook className="w-4 h-4" />
                            Facebook
                          </button>
                          <button 
                            onClick={() => { copyLink(provider); setSharingProvider(null); }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
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

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What People Say</h2>
            <p className="text-gray-600">Don't just take our word for it</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
            <Quote className="absolute top-8 left-8 w-16 h-16 text-blue-100" />
            <div className="relative z-10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">"{testimonials[activeTestimonial].text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</div>
                  <div className="text-gray-500">{testimonials[activeTestimonial].role}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx === activeTestimonial ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-20"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of customers and providers on Bixfind today</p>
          {!user && (
            <div className="flex gap-4 justify-center flex-col md:flex-row">
              <Link href="/auth/signup?type=customer" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                Sign Up as Customer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/signup?type=provider" className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                Become a Provider
                <Users className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Bixfind Logo" className="h-10 w-10" />
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
                <Link href="/auth/signup?type=provider" className="block hover:text-white transition">Become a Provider</Link>
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
