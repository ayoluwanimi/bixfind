'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Clock, Tag, DollarSign, ToggleLeft, ToggleRight, X, Music, Hotel, ShoppingBag, Sparkles, CheckCircle, Search } from 'lucide-react'
import { storage } from '@/lib/storage'

interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration: number
  active: boolean
}

const SERVICE_CATEGORIES: Record<string, { label: string; needsPrice: boolean; needsDuration: boolean; icon: string; keywords: string[] }> = {
  'barbing': { label: 'Barbing / Haircut', needsPrice: true, needsDuration: true, icon: '✂️', keywords: ['haircut', 'barber', 'barbing', 'fade', 'trim', 'shave', 'beard', 'clipper'] },
  'hair-styling': { label: 'Hair Styling', needsPrice: true, needsDuration: true, icon: '💇', keywords: ['hair', 'styling', 'braids', 'weave', 'wig', 'cornrows', 'dreadlocks', 'locks', 'twist', 'braid', 'hairdo'] },
  'makeup': { label: 'Makeup / Cosmetics', needsPrice: true, needsDuration: true, icon: '💄', keywords: ['makeup', 'make up', 'cosmetics', 'facial', 'glam', 'bridal makeup', 'beauty'] },
  'nail-care': { label: 'Nail Care', needsPrice: true, needsDuration: true, icon: '💅', keywords: ['nail', 'manicure', 'pedicure', 'gel', 'acrylic', 'nail art'] },
  'spa-massage': { label: 'Spa & Massage', needsPrice: true, needsDuration: true, icon: '🧴', keywords: ['spa', 'massage', 'relaxation', 'body scrub', 'facial', 'sauna', 'steam'] },
  'skincare': { label: 'Skincare', needsPrice: true, needsDuration: true, icon: '✨', keywords: ['skincare', 'skin care', 'acne', 'treatment', 'derma', 'glow', 'peel'] },
  'fashion-design': { label: 'Fashion Design', needsPrice: true, needsDuration: false, icon: '👗', keywords: ['fashion', 'designer', 'dress', 'outfit', 'clothing', 'tailor', 'sewing', ' Ankara', 'aso-oke', 'agbada'] },
  'tailoring': { label: 'Tailoring / Alteration', needsPrice: true, needsDuration: true, icon: '🪡', keywords: ['tailor', 'alteration', 'hem', 'stitch', 'sew', 'measurement', 'custom outfit'] },
  'photography': { label: 'Photography', needsPrice: true, needsDuration: true, icon: '📷', keywords: ['photo', 'photography', 'shoot', 'portrait', 'studio', 'camera', 'capture'] },
  'videography': { label: 'Videography', needsPrice: true, needsDuration: true, icon: '🎬', keywords: ['video', 'videography', 'film', 'cinema', 'shoot', 'editor', 'drone'] },
  'dj-services': { label: 'DJ Services', needsPrice: true, needsDuration: true, icon: '🎧', keywords: ['dj', 'deejay', 'mix', 'playlist', 'turntable', 'deck', 'sound'] },
  'live-music': { label: 'Live Music / Band', needsPrice: true, needsDuration: true, icon: '🎵', keywords: ['live music', 'band', 'performer', 'guitarist', 'singer', 'vocalist', 'instrumentalist'] },
  'event-planning': { label: 'Event Planning', needsPrice: true, needsDuration: false, icon: '🎉', keywords: ['event', 'planning', 'coordinator', 'organizer', 'party', 'wedding planner', 'decoration'] },
  'catering': { label: 'Catering Services', needsPrice: true, needsDuration: false, icon: '🍽️', keywords: ['catering', 'caterer', 'food service', 'buffet', 'event food', 'party food'] },
  'decoration': { label: 'Decoration / Décor', needsPrice: true, needsDuration: false, icon: '🎊', keywords: ['decoration', 'decor', 'décor', 'balloon', 'floral', 'setup', 'theme'] },
  'choreography': { label: 'Choreography', needsPrice: true, needsDuration: true, icon: '💃', keywords: ['choreography', 'dance', 'choreographer', 'routine', 'dance lesson'] },
  'fitness-training': { label: 'Fitness / Gym', needsPrice: true, needsDuration: true, icon: '💪', keywords: ['fitness', 'gym', 'training', 'workout', 'exercise', 'personal trainer', 'bodybuilding'] },
  'yoga': { label: 'Yoga / Meditation', needsPrice: true, needsDuration: true, icon: '🧘', keywords: ['yoga', 'meditation', 'pilates', 'breathwork', 'mindfulness'] },
  'tutoring': { label: 'Tutoring / Lessons', needsPrice: true, needsDuration: true, icon: '📚', keywords: ['tutor', 'tutoring', 'lesson', 'teaching', 'coaching', 'class', 'academy', 'training'] },
  'music-lessons': { label: 'Music Lessons', needsPrice: true, needsDuration: true, icon: '🎹', keywords: ['music lesson', 'piano', 'guitar', 'violin', 'drum', 'instrument lesson'] },
  'language-lessons': { label: 'Language Lessons', needsPrice: true, needsDuration: true, icon: '🗣️', keywords: ['language', 'english', 'french', 'yoruba', 'hausa', 'igbo', 'arabic', 'spanish'] },
  'driving-lessons': { label: 'Driving Lessons', needsPrice: true, needsDuration: true, icon: '🚗', keywords: ['driving', 'driver', 'car lesson', 'road', 'license', 'driving school'] },
  'cooking': { label: 'Cooking / Catering Classes', needsPrice: true, needsDuration: true, icon: '👨‍🍳', keywords: ['cooking', 'chef', 'culinary', 'food class', 'recipe', 'baking', 'pastry'] },
  'cleaning': { label: 'Cleaning Services', needsPrice: true, needsDuration: false, icon: '🧹', keywords: ['cleaning', 'cleaner', 'house cleaning', 'deep clean', 'janitorial', 'laundry', 'ironing'] },
  'plumbing': { label: 'Plumbing', needsPrice: true, needsDuration: true, icon: '🔧', keywords: ['plumber', 'plumbing', 'pipe', 'leak', 'drain', 'water', 'fixture'] },
  'electrical': { label: 'Electrical Services', needsPrice: true, needsDuration: true, icon: '⚡', keywords: ['electrician', 'electrical', 'wiring', 'generator', 'power', 'solar', 'inverter'] },
  'carpentry': { label: 'Carpentry / Woodwork', needsPrice: true, needsDuration: false, icon: '🪚', keywords: ['carpenter', 'carpentry', 'furniture', 'woodwork', 'cabinet', 'shelving', 'deck'] },
  'painting': { label: 'Painting Services', needsPrice: true, needsDuration: false, icon: '🎨', keywords: ['painter', 'painting', 'wall paint', 'interior', 'exterior', 'spray paint'] },
  'tiling': { label: 'Tiling / Flooring', needsPrice: true, needsDuration: false, icon: '🏗️', keywords: ['tiling', 'tiler', 'flooring', 'tiles', 'ceramic', 'marble', 'granite'] },
  'welding': { label: 'Welding / Metalwork', needsPrice: true, needsDuration: false, icon: '🔨', keywords: ['welder', 'welding', 'metal', 'gate', 'fence', 'iron', 'steel', 'fabrication'] },
  'air-conditioning': { label: 'AC / Refrigeration', needsPrice: true, needsDuration: true, icon: '❄️', keywords: ['air condition', 'ac', 'refrigerator', 'cooling', 'hvac', 'freezer'] },
  'pest-control': { label: 'Pest Control', needsPrice: true, needsDuration: true, icon: '🐛', keywords: ['pest', 'fumigation', 'insect', 'termite', 'rodent', 'cockroach', 'mosquito'] },
  'landscaping': { label: 'Landscaping / Gardening', needsPrice: true, needsDuration: false, icon: '🌿', keywords: ['landscape', 'gardener', 'garden', 'lawn', 'grass', 'tree', 'plant', 'farming'] },
  'real-estate': { label: 'Real Estate', needsPrice: true, needsDuration: false, icon: '🏠', keywords: ['real estate', 'property', 'house', 'apartment', 'land', 'agent', 'rent', 'lease'] },
  'hotel-accommodation': { label: 'Hotel / Accommodation', needsPrice: true, needsDuration: true, icon: '🏨', keywords: ['hotel', 'room', 'suite', 'accommodation', 'lodge', 'motel', 'inn', 'guest house'] },
  'transportation': { label: 'Transportation', needsPrice: true, needsDuration: true, icon: '🚕', keywords: ['transport', 'taxi', 'ride', 'delivery', 'logistics', 'dispatch', 'moving'] },
  'logistics-delivery': { label: 'Logistics / Delivery', needsPrice: true, needsDuration: true, icon: '📦', keywords: ['delivery', 'logistics', 'shipping', 'courier', 'dispatch', 'courier service'] },
  'web-development': { label: 'Web Development', needsPrice: true, needsDuration: false, icon: '💻', keywords: ['web', 'website', 'developer', 'frontend', 'backend', 'fullstack', 'html', 'css', 'javascript', 'react', 'nextjs'] },
  'mobile-app': { label: 'Mobile App Development', needsPrice: true, needsDuration: false, icon: '📱', keywords: ['mobile', 'app', 'android', 'ios', 'flutter', 'react native'] },
  'graphic-design': { label: 'Graphic Design', needsPrice: true, needsDuration: false, icon: '🖌️', keywords: ['graphic', 'design', 'logo', 'branding', 'flyer', 'banner', 'poster', 'canva'] },
  'ui-ux-design': { label: 'UI/UX Design', needsPrice: true, needsDuration: false, icon: '🎨', keywords: ['ui', 'ux', 'user interface', 'user experience', 'wireframe', 'prototype', 'figma'] },
  'digital-marketing': { label: 'Digital Marketing', needsPrice: true, needsDuration: false, icon: '📊', keywords: ['marketing', 'digital', 'social media', 'seo', 'ads', 'advertising', 'campaign', 'content marketing'] },
  'social-media': { label: 'Social Media Management', needsPrice: true, needsDuration: false, icon: '📲', keywords: ['social media', 'instagram', 'facebook', 'twitter', 'tiktok', 'content', 'community management'] },
  'copywriting': { label: 'Copywriting', needsPrice: true, needsDuration: false, icon: '✍️', keywords: ['copywriting', 'copywriter', 'content', 'article', 'blog', 'writing', 'script', 'seo content'] },
  'consulting': { label: 'Business Consulting', needsPrice: true, needsDuration: true, icon: '💼', keywords: ['consulting', 'consultant', 'business', 'strategy', 'advisory', 'management'] },
  'legal-services': { label: 'Legal Services', needsPrice: true, needsDuration: true, icon: '⚖️', keywords: ['lawyer', 'legal', 'attorney', 'solicitor', 'advocate', 'barrister', 'court'] },
  'accounting': { label: 'Accounting / Tax', needsPrice: true, needsDuration: true, icon: '🧮', keywords: ['accounting', 'accountant', 'tax', 'audit', 'bookkeeping', 'finance', 'financial'] },
  'insurance': { label: 'Insurance Services', needsPrice: true, needsDuration: false, icon: '🛡️', keywords: ['insurance', 'policy', 'coverage', 'claim', 'underwriting'] },
  'recruitment': { label: 'Recruitment / HR', needsPrice: true, needsDuration: false, icon: '👥', keywords: ['recruitment', 'hiring', 'staffing', 'headhunter', 'hr', 'human resource', 'job placement'] },
  'security-services': { label: 'Security Services', needsPrice: true, needsDuration: true, icon: '🔒', keywords: ['security', 'guard', 'bouncer', 'surveillance', 'cctv', 'protection'] },
  'automobile-repair': { label: 'Auto Repair / Mechanic', needsPrice: true, needsDuration: true, icon: '🔧', keywords: ['mechanic', 'auto repair', 'car repair', 'vehicle', 'engine', 'brake', 'tyre', 'mechanic'] },
  'car-wash': { label: 'Car Wash / Detailing', needsPrice: true, needsDuration: true, icon: '🚿', keywords: ['car wash', 'detailing', 'car cleaning', 'polish', 'wax', 'interior clean'] },
  'generator-repair': { label: 'Generator / Inverter', needsPrice: true, needsDuration: true, icon: '🔌', keywords: ['generator', 'inverter', 'power', 'repair', 'fuel', 'maintenance'] },
  'phone-repair': { label: 'Phone / Gadget Repair', needsPrice: true, needsDuration: true, icon: '📱', keywords: ['phone repair', 'screen', 'battery', 'gadget', 'laptop', 'computer', 'tablet'] },
  'laundry-pressing': { label: 'Laundry / Pressing', needsPrice: true, needsDuration: true, icon: '👔', keywords: ['laundry', 'washing', 'pressing', 'iron', 'dry clean', 'starching'] },
  'bakery': { label: 'Bakery / Pastry', needsPrice: true, needsDuration: false, icon: '🍰', keywords: ['bakery', 'bread', 'cake', 'pastry', 'pastry', 'confectionery', 'baking'] },
  'fast-food': { label: 'Fast Food / Snacks', needsPrice: true, needsDuration: false, icon: '🍔', keywords: ['fast food', 'snack', 'shawarma', 'burger', 'fries', 'chicken', 'grill', 'suya'] },
  'restaurant': { label: 'Restaurant / Dine-in', needsPrice: true, needsDuration: false, icon: '🍽️', keywords: ['restaurant', 'dine', 'meal', 'buffet', 'food', 'eatery', 'buka'] },
  'drinks-bar': { label: 'Drinks / Bar', needsPrice: true, needsDuration: false, icon: '🍹', keywords: ['bar', 'drinks', 'cocktail', 'wine', 'beer', 'smoothie', 'juice', 'barman'] },
  'pure-water': { label: 'Water / Beverages', needsPrice: true, needsDuration: false, icon: '💧', keywords: ['water', 'pure water', 'bottled water', 'beverage', 'sachet water'] },
  'tailoring-supplies': { label: 'Fashion Supplies', needsPrice: true, needsDuration: false, icon: '🧵', keywords: ['fabric', 'material', 'lace', 'thread', 'button', 'zipper', 'accessories'] },
  'electronics': { label: 'Electronics Sales', needsPrice: true, needsDuration: false, icon: '📺', keywords: ['electronics', 'tv', 'sound system', 'speaker', 'laptop', 'gadget', 'accessories'] },
  'supermarket': { label: 'Supermarket / Store', needsPrice: true, needsDuration: false, icon: '🛒', keywords: ['supermarket', 'grocery', 'store', 'shop', 'market', 'provisions'] },
  'beauty-supplies': { label: 'Beauty Products', needsPrice: true, needsDuration: false, icon: '🌸', keywords: ['beauty', 'cosmetic', 'product', 'cream', 'serum', 'oil', 'perfume'] },
  'jewelry': { label: 'Jewelry / Accessories', needsPrice: true, needsDuration: false, icon: '💎', keywords: ['jewelry', 'gold', 'silver', 'beads', 'chain', 'ring', 'earring', 'accessories'] },
  'photography-supplies': { label: 'Camera / Photo Equipment', needsPrice: true, needsDuration: false, icon: '📸', keywords: ['camera', 'lens', 'tripod', 'lighting', 'photo equipment', 'drone'] },
  'print-services': { label: 'Printing / Publishing', needsPrice: true, needsDuration: false, icon: '🖨️', keywords: ['print', 'printing', 'business card', 'flyer', 'banner', 'booklet', 'newspaper'] },
  'school-tutoring': { label: 'School Tutoring', needsPrice: true, needsDuration: true, icon: '📝', keywords: ['waec', 'jamb', 'neco', 'school', 'math', 'english', 'science', 'tutor', 'lesson'] },
  'music-production': { label: 'Music Production', needsPrice: true, needsDuration: true, icon: '🎙️', keywords: ['studio', 'recording', 'music production', 'beat', 'mixing', 'mastering', 'producer'] },
  'podcast': { label: 'Podcast Production', needsPrice: true, needsDuration: true, icon: '🎧', keywords: ['podcast', 'audio', 'recording', 'interview', 'show'] },
  'interior-design': { label: 'Interior Design', needsPrice: true, needsDuration: false, icon: '🏡', keywords: ['interior', 'design', 'home decor', 'furnishing', 'renovation'] },
  'architect': { label: 'Architecture', needsPrice: true, needsDuration: false, icon: '🏛️', keywords: ['architect', 'architecture', 'building', 'plan', 'blueprint', 'construction'] },
  'construction': { label: 'Construction / Building', needsPrice: true, needsDuration: false, icon: '🏗️', keywords: ['construction', 'building', 'civil', 'brick', 'concrete', 'block laying'] },
  'roofing': { label: 'Roofing Services', needsPrice: true, needsDuration: false, icon: '🏠', keywords: ['roofing', 'roof', 'tiles', 'ceiling', 'aluminum'] },
  'plumbing-supplies': { label: 'Plumbing Supplies', needsPrice: true, needsDuration: false, icon: '🚰', keywords: ['pipe fitting', 'plumbing supply', 'valve', 'tap', 'faucet', 'tank'] },
  'glass-aluminum': { label: 'Glass / Aluminum', needsPrice: true, needsDuration: false, icon: '🪟', keywords: ['glass', 'aluminum', 'window', 'door', 'frame', 'curtain wall'] },
  'signage': { label: 'Signage / Branding', needsPrice: true, needsDuration: false, icon: '🪧', keywords: ['signage', 'sign', 'billboard', 'neon', 'led sign', 'banner'] },
  'vulcanizing': { label: 'Vulcanizing / Tyre', needsPrice: true, needsDuration: true, icon: '🛞', keywords: ['vulcanizer', 'tyre', 'puncture', 'inflate', 'patch'] },
  'panel-beating': { label: 'Panel Beating', needsPrice: true, needsDuration: true, icon: '🔩', keywords: ['panel beater', 'body work', 'dent', 'spray', 'painting car'] },
  'towing': { label: 'Towing Services', needsPrice: true, needsDuration: true, icon: '🚛', keywords: ['tow', 'towing', 'breakdown', 'rescue', 'accident'] },
  'notary': { label: 'Notary / Legal Docs', needsPrice: true, needsDuration: true, icon: '📋', keywords: ['notary', 'affidavit', 'sworn', 'declaration', 'legal document'] },
  'translation': { label: 'Translation Services', needsPrice: true, needsDuration: true, icon: '🌐', keywords: ['translation', 'translator', 'interpreter', 'translate', 'localization'] },
  'counseling': { label: 'Counseling / Therapy', needsPrice: true, needsDuration: true, icon: '🧠', keywords: ['counseling', 'therapist', 'therapy', 'mental health', 'psychology', 'coach'] },
  'astrology': { label: 'Astrology / Spiritual', needsPrice: true, needsDuration: true, icon: '🔮', keywords: ['astrology', 'spiritual', 'herbalist', 'native doctor', 'prayer', 'fetish'] },
  'babysitting': { label: 'Babysitting / Childcare', needsPrice: true, needsDuration: true, icon: '👶', keywords: ['babysitter', 'childcare', 'nanny', 'child', 'kids', 'creche'] },
  'pet-services': { label: 'Pet Services', needsPrice: true, needsDuration: true, icon: '🐾', keywords: ['pet', 'dog', 'cat', 'veterinary', 'pet grooming', 'animal'] },
  'fumigation': { label: 'Fumigation', needsPrice: true, needsDuration: true, icon: '🧪', keywords: ['fumigation', 'pest control', 'chemical', 'spray', 'termite'] },
  'travel-tourism': { label: 'Travel / Tourism', needsPrice: true, needsDuration: false, icon: '✈️', keywords: ['travel', 'tourism', 'tour', 'visa', 'flight', 'booking', 'vacation'] },
  'visa-processing': { label: 'Visa Processing', needsPrice: true, needsDuration: false, icon: '🛂', keywords: ['visa', 'passport', 'immigration', 'travel document', 'processing'] },
  'event-rentals': { label: 'Event Equipment Rental', needsPrice: true, needsDuration: true, icon: '🎪', keywords: ['rental', 'tent', 'chair', 'canopy', 'generator rental', 'sound rental'] },
  'mc-hosting': { label: 'MC / Hosting', needsPrice: true, needsDuration: true, icon: '🎤', keywords: ['mc', 'master of ceremony', 'host', 'anchor', 'comedian'] },
  'souvenir-gifts': { label: 'Souvenirs / Gifts', needsPrice: true, needsDuration: false, icon: '🎁', keywords: ['souvenir', 'gift', 'present', 'custom gift', 'merchandise'] },
  'tailoring-machine': { label: 'Sewing Machine Service', needsPrice: true, needsDuration: true, icon: '🪡', keywords: ['sewing machine', 'machine repair', 'machine sale'] },
  'waste-management': { label: 'Waste Management', needsPrice: true, needsDuration: false, icon: '♻️', keywords: ['waste', 'refuse', 'recycling', 'disposal', 'bin', 'sanitation'] },
  'agriculture': { label: 'Agriculture / Farming', needsPrice: true, needsDuration: false, icon: '🌾', keywords: ['farming', 'agriculture', 'crop', 'harvest', 'poultry', 'livestock', 'fishery'] },
  'solar-energy': { label: 'Solar / Energy', needsPrice: true, needsDuration: true, icon: '☀️', keywords: ['solar', 'energy', 'panel', 'photovoltaic', 'power solution'] },
  'cctv-installation': { label: 'CCTV / Security Install', needsPrice: true, needsDuration: true, icon: '📹', keywords: ['cctv', 'camera installation', 'security system', 'surveillance'] },
  'networking': { label: 'Network / Internet', needsPrice: true, needsDuration: true, icon: '🌐', keywords: ['network', 'internet', 'wifi', 'router', 'fiber', 'broadband'] },
  'data-analysis': { label: 'Data Analysis', needsPrice: true, needsDuration: false, icon: '📈', keywords: ['data', 'analysis', 'analytics', 'excel', 'report', 'visualization'] },
  'virtual-assistant': { label: 'Virtual Assistant', needsPrice: true, needsDuration: true, icon: '🤖', keywords: ['virtual assistant', 'va', 'admin support', 'email', 'scheduling'] },
  'content-creation': { label: 'Content Creation', needsPrice: true, needsDuration: false, icon: '📹', keywords: ['content', 'creator', 'influencer', 'youtube', 'tiktok', 'blog', 'vlog'] },
  'voice-over': { label: 'Voice Over / Narration', needsPrice: true, needsDuration: true, icon: '🎙️', keywords: ['voice', 'narration', 'voiceover', 'announcer', 'radio', 'jingle'] },
  'branding': { label: 'Brand Strategy', needsPrice: true, needsDuration: false, icon: '🎯', keywords: ['brand', 'branding', 'identity', 'strategy', 'positioning'] },
  'interior-decor': { label: 'Interior Décor', needsPrice: true, needsDuration: false, icon: '🪴', keywords: ['interior decor', 'home styling', 'furnishing', 'curtain', 'upholstery'] },
  'other': { label: 'Other / General', needsPrice: true, needsDuration: true, icon: '📌', keywords: [] },
}

const CATEGORY_FEATURES: Record<string, { feature: string; label: string }[]> = {
  'dj-services': [{ feature: 'music', label: 'Music Player' }],
  'live-music': [{ feature: 'music', label: 'Music Player' }],
  'music-production': [{ feature: 'music', label: 'Music Player' }],
  'hotel-accommodation': [{ feature: 'hotel', label: 'Hotel Booking' }],
  'restaurant': [{ feature: 'hotel', label: 'Restaurant Menu' }],
  'fast-food': [{ feature: 'hotel', label: 'Restaurant Menu' }],
  'catering': [{ feature: 'hotel', label: 'Catering Menu' }],
  'drinks-bar': [{ feature: 'hotel', label: 'Bar Menu' }],
  'bakery': [{ feature: 'hotel', label: 'Bakery Menu' }],
  'photography': [{ feature: 'gallery', label: 'Photo Gallery' }],
  'videography': [{ feature: 'gallery', label: 'Video Gallery' }],
  'fashion-design': [{ feature: 'gallery', label: 'Lookbook Gallery' }],
  'graphic-design': [{ feature: 'gallery', label: 'Portfolio Gallery' }],
  'ui-ux-design': [{ feature: 'gallery', label: 'Portfolio Gallery' }],
  'makeup': [{ feature: 'gallery', label: 'Portfolio Gallery' }],
  'interior-design': [{ feature: 'gallery', label: 'Portfolio Gallery' }],
  'carpentry': [{ feature: 'gallery', label: 'Portfolio Gallery' }],
}

function autoDetectCategory(title: string): string {
  const lower = title.toLowerCase().trim()
  let bestMatch = 'other'
  let bestScore = 0
  for (const [key, cat] of Object.entries(SERVICE_CATEGORIES)) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        const score = kw.length
        if (score > bestScore) {
          bestScore = score
          bestMatch = key
        }
      }
    }
  }
  return bestMatch
}

function deriveCapabilities(services: Service[]) {
  const caps: Record<string, boolean> = { has_products: false, music: false, hotel: false, gallery: false }
  for (const service of services) {
    const features = CATEGORY_FEATURES[service.category]
    if (features) {
      for (const f of features) {
        caps[f.feature] = true
      }
    }
  }
  const products = storage.get('provider_products')
  if (Array.isArray(products) && products.length > 0) {
    caps.has_products = true
  }
  return caps
}

function getActiveFeatures(services: Service[]) {
  const seen = new Map<string, { feature: string; label: string }>()
  for (const service of services) {
    const features = CATEGORY_FEATURES[service.category]
    if (features) {
      for (const f of features) {
        if (!seen.has(f.feature)) seen.set(f.feature, f)
      }
    }
  }
  const products = storage.get('provider_products')
  if (Array.isArray(products) && products.length > 0) {
    if (!seen.has('has_products')) seen.set('has_products', { feature: 'has_products', label: 'Product Store' })
  }
  return Array.from(seen.values())
}

function getServiceFeatureBadges(category: string) {
  return CATEGORY_FEATURES[category] ?? []
}

function ServiceModal({ open, onClose, service, onSave }: {
  open: boolean
  onClose: () => void
  service: Service | null
  onSave: (s: Omit<Service, 'id'> & { id?: string }) => void
}) {
  const [form, setForm] = useState({ name: '', description: '', category: 'other', price: '', duration: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const detectedCategory = useMemo(() => form.name ? autoDetectCategory(form.name) : '', [form.name])

  const matchedCategory = form.category !== 'other' ? SERVICE_CATEGORIES[form.category] : SERVICE_CATEGORIES[detectedCategory] || SERVICE_CATEGORIES['other']

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return Object.entries(SERVICE_CATEGORIES)
    const q = searchQuery.toLowerCase()
    return Object.entries(SERVICE_CATEGORIES).filter(([key, cat]) =>
      cat.label.toLowerCase().includes(q) || key.includes(q) || cat.keywords.some(kw => kw.includes(q))
    )
  }, [searchQuery])

  useEffect(() => {
    if (service) {
      setForm({ name: service.name, description: service.description, category: service.category, price: service.price.toString(), duration: service.duration.toString() })
    } else {
      setForm({ name: '', description: '', category: 'other', price: '', duration: '' })
    }
    setSearchQuery('')
    setShowCategoryDropdown(false)
  }, [service, open])

  useEffect(() => {
    if (form.name && !service) {
      const detected = autoDetectCategory(form.name)
      if (detected !== 'other') {
        setForm(f => ({ ...f, category: detected }))
      }
    }
  }, [form.name, service])

  if (!open) return null

  const catInfo = SERVICE_CATEGORIES[form.category] || SERVICE_CATEGORIES['other']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    if (catInfo.needsPrice && !form.price) return
    if (catInfo.needsDuration && !form.duration) return
    onSave({
      id: service?.id,
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price) || 0,
      duration: Number(form.duration) || 0,
      active: service?.active ?? true,
    })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{service ? 'Edit Service' : 'Add Service'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Service Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="e.g. Bridal Makeup, Web Development, Haircut..." required />
            {form.name && !service && detectedCategory !== 'other' && (
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-detected: {SERVICE_CATEGORIES[detectedCategory]?.label || detectedCategory}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Category</label>
            <div className="relative">
              <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-left text-sm flex items-center justify-between">
                <span>{catInfo.icon} {catInfo.label}</span>
                <span className="text-white/30 text-xs">{showCategoryDropdown ? '▲' : '▼'}</span>
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  <div className="p-2 sticky top-0 bg-gray-800">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search categories..." className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none" autoFocus />
                    </div>
                  </div>
                  {filteredCategories.map(([key, cat]) => (
                    <button key={key} type="button" onClick={() => { setForm(f => ({ ...f, category: key })); setShowCategoryDropdown(false); setSearchQuery('') }} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${form.category === key ? 'bg-blue-600/20 text-blue-400' : 'text-white/80'}`}>
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="text-xs text-white/40 text-center py-3">No matching categories</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-20" placeholder="Describe your service..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {catInfo.needsPrice && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Price (₦)</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="5000" min="0" />
              </div>
            )}
            {catInfo.needsDuration && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="60" min="0" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">{service ? 'Save Changes' : 'Add Service'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function DeleteDialog({ open, name, onConfirm, onCancel }: {
  open: boolean; name: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">Delete Service</h3>
        <p className="text-white/60 mt-2 text-sm">Are you sure you want to delete &quot;{name}&quot;? This action cannot be undone.</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProviderServicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      if (e.message?.includes('MetaMask') || e.message?.includes('ethereum')) {
        e.preventDefault(); e.stopPropagation()
      }
    }
    window.addEventListener('error', errorHandler)
    const currentUser = storage.getUser()
    if (!currentUser || (currentUser.user_metadata?.user_type || currentUser.userType) !== 'provider') { router.push('/login'); return }
    setUser(currentUser)

    fetch('/api/provider/services', { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.services) {
          setServices(data.services)
          storage.setServices(data.services)
        }
      })
      .catch(() => {
        const saved = storage.getServices()
        if (saved.length > 0) setServices(saved)
      })
      .finally(() => setLoading(false))

    return () => window.removeEventListener('error', errorHandler)
  }, [router])

  useEffect(() => {
    if (services.length === 0 && !loading) return
    const caps = deriveCapabilities(services)
    storage.set('provider_capabilities', caps)
    storage.set('provider_categories', [...new Set(services.map(s => s.category).filter(Boolean))])
  }, [services, loading])

  const activeFeatures = getActiveFeatures(services)

  const toggleActive = useCallback(async (id: string) => {
    const svc = services.find(s => s.id === id)
    if (!svc) return
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s)
    setServices(updated)
    storage.setServices(updated)
    try {
      await fetch('/api/provider/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !svc.active }),
      })
    } catch {}
  }, [services])

  const saveService = useCallback(async (data: Omit<Service, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const res = await fetch('/api/provider/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const { data: updated } = await res.json()
          const updatedServices = services.map(s => s.id === data.id ? { ...s, ...data, active: s.active } as Service : s)
          setServices(updatedServices)
          storage.setServices(updatedServices)
        }
      } else {
        const res = await fetch('/api/provider/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const { data: created } = await res.json()
          const newService: Service = {
            id: created.id,
            name: created.name,
            description: created.description || '',
            category: created.category || '',
            price: Number(created.price) || 0,
            duration: 60,
            active: true,
          }
          const updated = [...services, newService]
          setServices(updated)
          storage.setServices(updated)
        }
      }
    } catch {}
  }, [services])

  const deleteService = useCallback(async (id: string) => {
    const updated = services.filter(s => s.id !== id)
    setServices(updated)
    storage.setServices(updated)
    setDeleting(null)
    try {
      await fetch(`/api/provider/services?id=${id}`, { method: 'DELETE' })
    } catch {}
  }, [services])

  if (!user) return null

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <ServiceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} service={editing} onSave={saveService} />
      <DeleteDialog open={!!deleting} name={deleting?.name || ''} onConfirm={() => deleting && deleteService(deleting.id)} onCancel={() => setDeleting(null)} />

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-white/50 mt-1">Manage your service listings</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Service
        </motion.button>
      </motion.div>

      {!loading && activeFeatures.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Website Builder Features</h3>
          </div>
          <p className="text-xs text-white/50 mb-3">Based on your service categories, the following features are enabled on your website:</p>
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map(f => (
              <span key={f.feature} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/80">
                <CheckCircle className="w-3 h-3 text-green-400" />
                {f.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
              <div className="flex justify-between"><div className="space-y-2 flex-1"><div className="h-5 bg-white/10 rounded w-40" /><div className="h-3 bg-white/10 rounded w-60 mt-2" /></div><div className="h-6 bg-white/10 rounded-full w-16" /></div>
              <div className="flex gap-4 mt-4"><div className="h-3 bg-white/10 rounded w-20" /><div className="h-3 bg-white/10 rounded w-16" /><div className="h-3 bg-white/10 rounded w-24" /></div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
          <Tag className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/60 mb-1">No services yet</h3>
          <p className="text-white/40 text-sm mb-6">Add your first service to get started!</p>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Your First Service
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                exit={{ opacity: 0, x: -100 }}
                layout
                className={`bg-white/5 border rounded-xl p-5 transition-colors ${service.active ? 'border-white/10' : 'border-white/5 opacity-60'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{service.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${service.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {service.description && <p className="text-sm text-white/50 truncate">{service.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        {SERVICE_CATEGORIES[service.category]?.icon || '📌'} {SERVICE_CATEGORIES[service.category]?.label || service.category}
                      </span>
                      {getServiceFeatureBadges(service.category).map((badge, bi) => (
                        <span key={bi} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/20 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" /> {badge.label}
                        </span>
                      ))}
                      {service.price > 0 && <span className="flex items-center gap-1 font-medium text-emerald-400"><DollarSign className="w-3.5 h-3.5" /> ₦{service.price.toLocaleString('en-NG')}</span>}
                      {service.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(service.id)} className={`p-2 rounded-lg transition-colors ${service.active ? 'text-green-400 hover:bg-green-500/20' : 'text-white/30 hover:bg-white/10'}`} title={service.active ? 'Deactivate' : 'Activate'}>
                      {service.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => { setEditing(service); setModalOpen(true) }} className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleting(service)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
