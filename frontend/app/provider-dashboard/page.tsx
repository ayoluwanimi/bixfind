'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { Wallet, TrendingUp, Package, BarChart3, LogOut, Plus, Edit2, Trash2, Sparkles, Loader2, Zap, X, Receipt, ShoppingCart, Boxes, BookOpen, Settings as SettingsIcon, FileText, Menu, ChevronDown, Globe, ExternalLink, Eye, Shield, CheckCircle, XCircle } from 'lucide-react'
import { storage } from '../../lib/storage'
import { toast } from 'sonner'
import HotelQRManager from '@/components/HotelQRManager'

const API_BASE = 'https://api-eal2ibekhq-uc.a.run.app'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'services', label: 'Services', icon: '📦' },
  { id: 'sales', label: 'Sales', icon: '📈' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'ledger', label: 'Ledger', icon: '📒' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'wallet', label: 'Wallet', icon: '💰' },
  { id: 'website', label: 'Website', icon: '🌐' },
  { id: 'hotel', label: 'Hotel QR', icon: '🏨' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

interface DynamicField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  placeholder?: string
  options?: string[]
  required?: boolean
}

interface ServiceTemplate {
  title: string
  category: string
  subcategory: string
  price: string
  priceType: string
  description: string
  priceRange: string
  estimatedDuration: string
  tags: string[]
  dynamicFields: DynamicField[]
}

const serviceTemplates: Record<string, ServiceTemplate> = {
  plumbing: {
    title: 'Professional Plumbing Services',
    category: 'home',
    subcategory: 'Plumbing',
    price: '85',
    priceType: 'hourly',
    priceRange: '₦25,000-₦45,000/hour',
    estimatedDuration: '1-4 hours',
    description: 'Expert plumbing services including leak repairs, pipe installation, drain cleaning, water heater services, and emergency plumbing solutions.',
    tags: ['leak-repair', 'pipe-installation', 'drain-cleaning', 'water-heater'],
    dynamicFields: [
      { id: 'license', label: 'License Number', type: 'text', placeholder: 'PLB-XXXXX', required: true },
      { id: 'emergency', label: 'Emergency Services', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'insurance', label: 'Insurance Coverage', type: 'select', options: ['Full Coverage', 'Basic', 'None'] },
      { id: 'equipment', label: 'Specialized Equipment', type: 'textarea', placeholder: 'List any specialized equipment you use...' }
    ]
  },
  electrical: {
    title: 'Certified Electrical Services',
    category: 'home',
    subcategory: 'Electrical',
    price: '95',
    priceType: 'hourly',
    priceRange: '₦30,000-₦55,000/hour',
    estimatedDuration: '1-6 hours',
    description: 'Professional electrical services including wiring, lighting installation, panel upgrades, outlet repairs, and safety inspections.',
    tags: ['wiring', 'lighting', 'panel-upgrade', 'safety-inspection'],
    dynamicFields: [
      { id: 'license', label: 'Electrical License', type: 'text', placeholder: 'ELC-XXXXX', required: true },
      { id: 'voltage', label: 'Specialization', type: 'select', options: ['Residential', 'Commercial', 'Industrial', 'All'], required: true },
      { id: ' permits', label: 'Permits Available', type: 'select', options: ['Yes', 'No'] },
      { id: 'safety', label: 'Safety Certification', type: 'textarea', placeholder: 'List safety certifications...' }
    ]
  },
  cleaning: {
    title: 'Professional Cleaning Services',
    category: 'home',
    subcategory: 'Cleaning',
    price: '120',
    priceType: 'fixed',
    priceRange: '₦15,000-₦50,000/session',
    estimatedDuration: '2-5 hours',
    description: 'Comprehensive cleaning services for homes and offices including deep cleaning, move-in/move-out cleaning, and regular maintenance.',
    tags: ['deep-cleaning', 'move-in-out', 'regular-maintenance', 'eco-friendly'],
    dynamicFields: [
      { id: 'supplies', label: 'Supplies Included', type: 'select', options: ['Yes', 'Customer Provides', 'Upon Request'], required: true },
      { id: 'equipment', label: 'Equipment', type: 'textarea', placeholder: 'List cleaning equipment and products...' },
      { id: 'ecoFriendly', label: 'Eco-Friendly Products', type: 'select', options: ['Yes', 'Standard Only', 'Both Available'] },
      { id: 'staff', label: 'Team Size', type: 'select', options: ['Solo', '2-3 People', '4+ People'] }
    ]
  },
  painting: {
    title: 'Expert Painting Services',
    category: 'home',
    subcategory: 'Painting',
    price: '250',
    priceType: 'fixed',
    priceRange: '₦80,000-₦400,000/project',
    estimatedDuration: '1-7 days',
    description: 'Professional interior and exterior painting services including color consultation, surface preparation, and quality finishes.',
    tags: ['interior', 'exterior', 'cabinet-painting', 'commercial'],
    dynamicFields: [
      { id: 'license', label: 'Contractor License', type: 'text', placeholder: 'CTR-XXXXX' },
      { id: 'surface', label: 'Surface Types', type: 'textarea', placeholder: 'Drywall, wood, metal, concrete...' },
      { id: 'prep', label: 'Preparation Included', type: 'select', options: ['Yes', 'Additional Cost', 'Quotes Separately'] },
      { id: 'lead', label: 'Lead-Safe Certified', type: 'select', options: ['Yes', 'No'] }
    ]
  },
  hairdresser: {
    title: 'Professional Hair Styling Services',
    category: 'personal',
    subcategory: 'Hair Salon',
    price: '75',
    priceType: 'fixed',
    priceRange: '₦8,000-₦25,000/session',
    estimatedDuration: '1-3 hours',
    description: 'Expert hair styling services including cuts, coloring, treatments, and styling for all occasions.',
    tags: ['cuts', 'coloring', 'treatments', 'styling', 'bridal'],
    dynamicFields: [
      { id: 'specialty', label: 'Specialty', type: 'select', options: ['General', 'Colorist', 'Texture Expert', 'Bridal Specialist'], required: true },
      { id: 'products', label: 'Professional Products', type: 'textarea', placeholder: 'List product brands used...' },
      { id: 'mobile', label: 'Mobile Service', type: 'select', options: ['Yes', 'No', 'Available for Events'] },
      { id: 'extensions', label: 'Hair Extensions', type: 'select', options: ['Yes', 'No', 'Consultation Only'] }
    ]
  },
  tutoring: {
    title: 'Personalized Tutoring Services',
    category: 'education',
    subcategory: 'Tutoring',
    price: '60',
    priceType: 'hourly',
    priceRange: '₦5,000-₦15,000/hour',
    estimatedDuration: '1-2 hours/session',
    description: 'One-on-one tutoring in various subjects with customized learning plans and progress tracking.',
    tags: ['math', 'science', 'english', 'test-prep', 'language'],
    dynamicFields: [
      { id: 'subjects', label: 'Subjects', type: 'textarea', placeholder: 'List subjects you teach...', required: true },
      { id: 'qualifications', label: 'Qualifications', type: 'textarea', placeholder: 'Degree, certifications...', required: true },
      { id: 'online', label: 'Online Sessions', type: 'select', options: ['Yes', 'In-Person', 'Both'] },
      { id: 'ages', label: 'Age Groups', type: 'select', options: ['Elementary', 'Middle School', 'High School', 'College', 'Adult'] }
    ]
  },
  fitness: {
    title: 'Personal Fitness Training',
    category: 'personal',
    subcategory: 'Personal Training',
    price: '80',
    priceType: 'hourly',
    priceRange: '₦10,000-₦25,000/hour',
    estimatedDuration: '1-2 hours/session',
    description: 'Customized fitness training programs designed to meet your specific goals with certified personal trainers.',
    tags: ['strength', 'cardio', 'yoga', 'crossfit', 'nutrition'],
    dynamicFields: [
      { id: 'certification', label: 'Certification', type: 'text', placeholder: 'NASM, ACE, ACSM...', required: true },
      { id: 'specialty', label: 'Training Style', type: 'select', options: ['Strength', 'Cardio', 'Yoga', 'HIIT', 'CrossFit', 'General Fitness'] },
      { id: 'online', label: 'Online Training', type: 'select', options: ['Yes', 'In-Person', 'Hybrid'] },
      { id: 'nutrition', label: 'Nutrition Coaching', type: 'select', options: ['Included', 'Additional Cost', 'Not Available'] }
    ]
  },
  photography: {
    title: 'Professional Photography Services',
    category: 'personal',
    subcategory: 'Photography',
    price: '300',
    priceType: 'package',
    priceRange: '₦80,000-₦500,000/session',
    estimatedDuration: '2-4 hours',
    description: 'Professional photography for events, portraits, products, and commercial projects with edited digital deliverables.',
    tags: ['portrait', 'event', 'product', 'commercial', 'wedding'],
    dynamicFields: [
      { id: 'equipment', label: 'Equipment', type: 'textarea', placeholder: 'Camera bodies, lenses...' },
      { id: 'style', label: 'Photography Style', type: 'select', options: ['Traditional', 'Photojournalistic', 'Fine Art', 'Modern', 'Candid'] },
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'Number of edited photos, albums...' },
      { id: 'travel', label: 'Travel Included', type: 'select', options: ['Local Only', 'Within 50 miles', 'Anywhere'] }
    ]
  }
}

export default function ProviderDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] })
  const [services, setServices] = useState<any[]>([])
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<ServiceTemplate | null>(null)
  const [editingService, setEditingService] = useState<any>(null)
  const [newService, setNewService] = useState({
    title: '',
    category: '',
    subcategory: '',
    price: '',
    priceType: 'fixed',
    description: '',
    serviceArea: '',
    experience: '',
    certifications: '',
    workingHours: '',
    highlights: '',
  })
  const [inventory, setInventory] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [businessSettings, setBusinessSettings] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    workingHours: '',
    whatsapp: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    snapchat: '',
    facebook: '',
    linkedin: '',
    // Safety Verification
    idVerified: false,
    idNumber: '',
    idImage: '',
    policeClearance: false,
    policeClearanceDoc: '',
    insuranceStatus: 'none', // none, basic, full
    insuranceDoc: '',
    emergencyContact: '',
    emergencyPhone: '',
    yearsInBusiness: 0,
    backgroundCheckStatus: 'pending', // pending, in_review, approved, rejected
  })

  const serviceCategories = [
    { 
      id: 'automotive', 
      name: 'Automotive & Vehicles', 
      keywords: ['car', 'auto', 'vehicle', 'motor', 'vehicle', 'drive', 'driving', 'license', 'driving', 'dealership', 'dealer', 'automobile', 'tokunbo', 'naija', 'buy', 'sell car', 'car dealer', 'auto dealer'],
      subcategories: ['Car Sales/Dealership', 'Car Repairs', 'Vehicle Diagnostics', 'Oil Change & Lubrication', 'Tire Service', 'Battery Service', 'Car Detailing', 'Towing Services', 'Panel Beating', 'Spray Painting', 'Vehicle Inspection', 'Car Rental', 'Logistics', 'Transport', 'Dispatch Rider', 'Delivery Services', 'Car Tracking/GPS', 'Auto Electrical', 'AC Repair', 'Engine Overhaul', 'Transmission', 'Brake Service', 'Suspension']
    },
    { 
      id: 'tech', 
      name: 'Technology & IT', 
      keywords: ['tech', 'computer', 'laptop', 'phone', 'software', 'web', 'app', 'coding', 'programming', 'IT', 'digital', 'data', 'network', 'cyber', 'security', 'software', 'hardware', 'website', 'graphic', 'design', 'ui', 'ux', 'logo', 'branding', 'social media', 'marketing', 'digital marketing', 'seo', 'content', 'video', 'editing', 'photography', 'camera'],
      subcategories: ['Web Development', 'Mobile App Development', 'Software Development', 'IT Support', 'Network Setup', 'Cybersecurity', 'Data Analysis', 'Cloud Services', 'UI/UX Design', 'Graphic Design', 'Logo Design', 'Brand Identity', 'Video Production', 'Video Editing', 'Photography', 'Photo Editing', 'Social Media Management', 'Digital Marketing', 'SEO Services', 'Content Writing', 'Copywriting', 'Email Marketing', 'Bulk SMS', 'Software Installation', 'Hardware Repair', 'Data Recovery', 'Computer Repair', 'Phone Repair', 'Tablet Repair', 'CCTV Installation', 'Solar/Inverter Setup', 'Intercom Systems']
    },
    { 
      id: 'home', 
      name: 'Home Services', 
      keywords: ['home', 'house', 'property', 'apartment', 'real estate', 'furniture', 'interior', 'decoration', 'plumbing', 'pipe', 'water', 'electrical', 'light', 'wiring', 'painting', 'paint', 'carpentry', 'wood', 'furniture', 'cleaning', 'laundry', 'dry cleaning', 'pest', 'fumigation', 'fumigate', 'landscaping', 'garden', 'gardening', 'pool', 'swimming', 'renovation', 'construction', 'building', 'mason', 'tiling', 'roofing', 'welding', 'fabrication', 'metalwork', 'aluminum', 'glass', 'curtain', 'blinds'],
      subcategories: ['Plumbing Repairs', 'Pipe Installation', 'Water Tank Installation', 'Drainage Services', 'Electrical Wiring', 'Light Installation', 'Fan Installation', 'AC Installation', 'House Painting', 'Interior Painting', 'Exterior Painting', 'Furniture Making', 'Furniture Repair', 'Cabinet Making', 'Upholstery', 'House Cleaning', 'Office Cleaning', 'Post-Construction Cleaning', 'Laundry Services', 'Dry Cleaning', 'Fumigation & Pest Control', 'Landscaping', 'Garden Maintenance', 'Swimming Pool Service', 'Home Renovation', 'Kitchen Remodeling', 'Bathroom Remodeling', 'POP Ceiling', 'Tiling Services', 'Roofing', 'Welding & Fabrication', 'Aluminum Works', 'Glass Works', 'Curtain & Blind Installation', 'Interior Decoration', 'Real Estate Agent', 'Property Management', 'House Moving']
    },
    { 
      id: 'beauty', 
      name: 'Beauty & Personal Care', 
      keywords: ['hair', 'salon', 'beauty', 'makeup', 'make-up', 'skincare', 'skin', 'nails', 'manicure', 'pedicure', 'spa', 'massage', 'wellness', 'barber', 'grooming', 'waxing', 'facial', 'haircut', 'styling', 'weaving', 'braiding', 'relaxer', 'coloring', 'highlights', 'perming', 'locs', 'hair extension', 'bridal', 'wedding', 'gele', ' makeover', 'eyelash', 'eyebrow'],
      subcategories: ['Hair Salon', 'Barbershop', 'Makeup Artist', 'Hair Styling', 'Hair Coloring', 'Hair Weaving', 'Braiding', 'Hair Extension', 'Relaxer/Perming', 'Locs & Twists', 'Bridal Hair & Makeup', 'Gele Styling', 'Nail Tech/Manicure', 'Pedicure', 'Gel Nails', 'Acrylic Nails', 'Spa Services', 'Massage Therapy', 'Facial Treatment', 'Skincare', 'Waxing', 'Threading', 'Eyelash Extension', 'Eyebrow Shaping', 'Body Contouring', 'Teeth Whitening', 'Piercing', 'Tattoo']
    },
    { 
      id: 'health', 
      name: 'Health & Medical', 
      keywords: ['health', 'medical', 'doctor', 'nurse', 'healthcare', 'clinic', 'hospital', 'therapy', 'physiotherapy', 'dental', 'dentist', 'optical', 'optician', 'eye', 'vision', 'pharmacy', 'medicine', 'drug', 'laboratory', 'test', 'scan', 'x-ray', 'ultrasound', 'maternity', 'pregnancy', 'baby', 'childcare', 'elderly', 'caregiver', 'nursing', 'home care'],
      subcategories: ['Doctor Consultation', 'Nurse Services', 'Physiotherapy', 'Dental Care', 'Optical Services', 'Pharmacy', 'Laboratory Services', 'X-Ray & Scan', 'Ultrasound', 'ECG Services', 'Maternity Care', 'Baby Care Services', 'Elderly Care', 'Home Nursing', 'Ambulance Services', 'Mental Health', 'Nutritionist', 'Fitness Training', 'Yoga Instructor', 'Chiropractor', 'Speech Therapy', 'Occupational Therapy']
    },
    { 
      id: 'education', 
      name: 'Education & Training', 
      keywords: ['education', 'teaching', 'tutor', 'tutoring', 'lesson', 'class', 'course', 'training', 'school', 'university', 'exam', 'exam prep', 'jamb', 'waec', 'neco', 'gce', 'nursing', 'professional exam', 'language', 'english', 'french', 'yoruba', 'igbo', 'hausa', 'spanish', 'chinese', 'music', 'piano', 'guitar', 'drum', 'violin', 'dance', 'art', 'craft', 'sewing', 'tailoring', 'design', 'coding', 'programming', 'computer', 'driving', 'license'],
      subcategories: ['Private Tutoring', 'Exam Prep (JAMB/WAEC/NECO)', 'Language Classes', 'Music Lessons', 'Dance Classes', 'Art Classes', 'Craft & Sewing', 'Tailoring Classes', 'Computer Training', 'Coding Classes', 'Driving School', 'Professional Certifications', 'Business Training', 'Leadership Training', 'Sales Training', 'Customer Service Training', 'Project Management', 'IELTS/TOEFL Prep', 'French Classes', 'Yoruba Classes', 'Igbo Classes', 'Chinese Classes', 'Spanish Classes', 'Piano Lessons', 'Guitar Lessons', 'Violin Lessons', 'Drum Lessons', 'Vocational Training', 'Skill Acquisition']
    },
    { 
      id: 'events', 
      name: 'Events & Entertainment', 
      keywords: ['event', 'party', 'wedding', 'birthday', 'anniversary', 'graduation', 'corporate', 'conference', 'seminar', 'workshop', 'catering', 'food', 'cake', 'decoration', 'decor', 'florist', 'flowers', 'MC', 'emcee', 'DJ', 'disc jockey', 'band', 'musician', 'saxophone', 'comedian', 'comedian', 'anchor', 'host', 'comedian', 'clown', 'magician', 'photographer', 'videographer', 'camera', 'lighting', 'sound', 'equipment', 'rental', 'hire', 'chair', 'tent', 'canopy', 'inflatable', 'bouncer'],
      subcategories: ['Wedding Planning', 'Event Planning', 'Birthday Party Planning', 'Corporate Events', 'Catering Services', 'Cake Making', 'Small Chops', 'Event Decoration', 'Florist Services', 'MC/Emcee', 'DJ Services', 'Live Band', 'Musician', 'Comedian', 'Event Host', 'Photographer', 'Videographer', 'Photo Booth', 'Equipment Rental', 'Chair Rental', 'Tent/Canopy Rental', 'Inflatable Bounce House', 'Lighting Services', 'Sound System', 'Ushering Services', 'Security Services', 'Event Security']
    },
    { 
      id: 'musician', 
      name: 'Musicians & Music', 
      keywords: ['musician', 'music', 'singer', 'song', 'artist', 'rapper', 'hip hop', 'afrobeats', 'juju', 'fuji', 'highlife', 'rap', 'vocals', 'guitar', 'drum', 'piano', 'keyboard', 'saxophone', 'trumpet', 'bass', 'band', 'producer', 'beat', 'recording', 'studio', 'mixing', 'mastering', 'sound engineer', 'vocalist', 'choir', 'church', 'gospel', 'praise', 'worship', 'dj', 'disc jockey', 'playlist', 'spotify', 'apple music', 'audio', 'mp3', 'download', 'stream', 'show', 'performance', 'live', 'gig', 'event', 'party', 'wedding', 'birthday', 'ceremony', 'album', 'ep', 'single', 'feat', 'feature', 'lyrics', 'melody', 'rhythm', 'beats'],
      subcategories: ['Solo Artist/Singer', 'Rapper/Emcee', 'Band/Group', 'DJ/Disc Jockey', 'Producer/Beatmaker', 'Sound Engineer', 'Recording Artist', 'Live Performer', 'Gospel Artist', 'Fuji Artist', 'Juju Artist', 'Highlife Artist', 'Afrobeats Artist', 'Session Musician', 'Vocalist', 'Instrumentalist', 'Music Teacher', 'Music Producer', 'Mixing Engineer', 'Mastering Engineer', 'Songwriter', 'Composer', 'Arranger', 'Chorister', 'Choral Director', 'Church Musician', 'Wedding Musician', 'Event Musician', 'Corporate Event Musician', 'Music Download Store', 'Beat Selling', 'Music Promotion', 'Music Distribution']
    },
    { 
      id: 'food', 
      name: 'Food & Catering', 
      keywords: ['food', 'catering', 'cook', 'cooking', 'chef', 'restaurant', 'eat', 'meal', 'delivery', 'delivery', 'swallow', ' pounded yam', 'egusi', 'soup', 'rice', 'stew', 'jollof', 'fried rice', 'chin chin', 'akara', 'moi moi', 'shawarma', 'burger', 'pizza', 'ice cream', 'pastry', 'baking', 'bread', 'cakes', ' confectionery', 'snacks', 'drinks', 'chapman', 'zobo', 'wine', 'drinks', 'catering', 'food vendor', 'home cook'],
      subcategories: ['Catering Services', 'Meal Delivery', 'Home-Cooked Food', 'Party Jollof Rice', 'Small Chops', 'Baking/Cakes', 'Pastries', 'Bread Making', 'Shawarma', 'Burger & Pizza', 'Ice Cream', 'Chin Chin & Snacks', 'Akara & Moi Moi', 'Soup & Swallow', 'Grill & BBQ', 'Sushi', 'Confectionery', 'Drinks & Cocktails', 'Food Truck', 'Catering Equipment Rental']
    },
    { 
      id: 'fashion', 
      name: 'Fashion & Clothing', 
      keywords: ['fashion', 'clothing', 'clothes', 'wear', 'dress', 'shirt', 'trouser', 'skirt', 'blouse', 'agbada', 'buba', 'iro', 'wrapper', 'aso oke', 'ankara', 'lace', 'suit', 'tailor', 'tailoring', 'sewing', 'fashion designer', 'stylist', 'boutique', 'shop', 'store', 'shoes', 'footwear', 'bag', 'leather', 'jewelry', 'accessories', 'watch', 'sunglasses', 'perfume', 'cologne', 'cosmetic', 'makeup', 'hair product'],
      subcategories: ['Custom Tailoring', 'Fashion Design', 'Boutique', 'Clothing Store', 'Shoe Store', 'Bag Store', 'Jewelry Store', 'Watch Store', 'Perfume/Cosmetics', 'Lace & Fabric Store', 'Aso-Oke & Ankara', 'Agbada Making', 'Suits & Corporate Wear', 'Wedding Dress', 'Casual Wear', 'Children Clothing', 'Men Fashion', 'Women Fashion', 'Vintage Clothing', 'Shoe Repair', 'Bag Repair', 'Dry Cleaning', 'Laundry', 'Fashion Consulting', 'Personal Stylist', 'Wardrobe Management']
    },
    { 
      id: 'construction', 
      name: 'Construction & Engineering', 
      keywords: ['construction', 'building', 'engineer', 'engineering', 'architect', 'architecture', 'plan', 'design', 'foundation', 'structure', 'concrete', 'cement', 'block', 'brick', 'iron', 'steel', 'rod', 'sand', 'gravel', 'aggregate', 'road', 'bridge', 'highway', 'survey', 'quantity surveyor', 'project manager', 'construction manager', 'civil engineer', 'electrical engineer', 'mechanical engineer', 'architect', 'interior designer'],
      subcategories: ['Architectural Design', 'Building Construction', 'Road Construction', 'Bridge Construction', 'Electrical Installation', 'Plumbing Installation', 'HVAC Installation', 'Structural Engineering', 'Civil Engineering', 'Quantity Surveying', 'Project Management', 'Building Inspection', 'Renovation', 'Dimensional Survey', 'Soil Test', 'Foundation Works', 'Concrete Works', 'Masonry', 'Steel Works', 'Roofing', 'Painting', 'Tiling', 'Glass Installation', 'Aluminum Works', 'Waterproofing', 'Landscaping Construction']
    },
    { 
      id: 'agriculture', 
      name: 'Agriculture & Farming', 
      keywords: ['agriculture', 'farming', 'farm', 'crop', 'livestock', 'poultry', 'fish', 'fishery', 'pig', 'goat', 'sheep', 'cattle', 'chicken', 'egg', 'meat', 'vegetable', 'tomato', 'cassava', 'maize', 'rice', 'beans', 'pepper', 'okra', 'spinach', 'ugwu', 'lettuce', 'carrot', 'cabbage', 'greenhouse', 'irrigation', 'fertilizer', 'seed', 'seedling', 'nursery', 'plant', 'harvest', 'agro', 'agritech'],
      subcategories: ['Crop Farming', 'Livestock Farming', 'Poultry Farming', 'Fish Farming/Aquaculture', 'Piggery', 'Goat/Sheep Rearing', 'Cattle Rearing', 'Vegetable Farming', 'Fruit Farming', 'Greenhouse Farming', 'Irrigation Services', 'Agro-Processing', 'Farm Equipment Rental', 'Farm Management', 'Agro Consultancy', 'Poultry Supply', 'Livestock Supply', 'Fish Supply', 'Feed Supply', 'Fertilizer Supply', 'Agro Chemicals', 'Nursery/Seedlings', 'Agricultural Consulting', 'Export Services']
    },
    { 
      id: 'finance', 
      name: 'Finance & Business Services', 
      keywords: ['finance', 'financial', 'accounting', 'accountant', 'bookkeeping', 'tax', 'taxation', 'audit', 'payroll', 'banking', 'loan', 'credit', 'investment', 'insurance', 'broker', 'stock', 'share', 'business', 'company', 'incorporation', 'CAC', 'registration', ' trademark', 'patent', 'legal', 'lawyer', 'attorney', 'court', 'consulting', 'consultant', 'coach', 'mentor', 'franchise'],
      subcategories: ['Accounting Services', 'Bookkeeping', 'Tax Preparation', 'Tax Consultation', 'Audit Services', 'Financial Planning', 'Business Registration (CAC)', 'Trademark Registration', 'Company Secretary', 'Legal Services', 'Lawyer/Attorney', 'Business Consulting', 'Business Coaching', 'Investment Advisory', 'Insurance Services', 'Loan Services', 'POS Services', 'Bureau de Change', 'Money Transfer', 'Salary Advance', 'Payroll Management', 'Virtual CFO', 'Market Research', 'Business Plan Writing', 'Grant Writing']
    },
    { 
      id: 'media', 
      name: 'Media & Communication', 
      keywords: ['media', 'broadcast', 'television', 'TV', 'radio', 'news', 'journalism', 'journalist', 'reporter', 'anchor', ' presenter', 'producer', 'director', 'content', 'creator', 'youtube', 'influencer', 'blog', 'blogger', 'vlog', 'podcast', 'streaming', 'live', 'advertising', 'advert', 'campaign', 'publicity', 'pr', 'public relations', 'brand', 'communication'],
      subcategories: ['TV Production', 'Radio Production', 'News Reporting', 'Journalism', 'Content Creation', 'YouTube Management', 'Influencer Marketing', 'Blog Management', 'Podcast Production', 'Live Streaming', 'Advertising', 'Public Relations', 'Brand Communication', 'Media Buying', 'Copywriting', 'Script Writing', 'Voice Over', 'Translation Services', 'Interpretation', 'Signage Design', 'Billboard Advertising', 'Social Media Management', 'Community Management']
    },
    { 
      id: 'security', 
      name: 'Security Services', 
      keywords: ['security', 'guard', 'patrol', 'surveillance', 'camera', 'CCTV', 'alarm', 'lock', 'safe', 'vault', 'access', 'control', 'biometric', 'fingerprint', 'face recognition', 'cyber security', 'cybersecurity', 'investigation', 'detective', 'background check', 'vetting', 'armored', 'vehicle', 'escort'],
      subcategories: ['Security Guards', 'Mobile Patrol', 'Static Guards', 'Event Security', 'Armed Security', 'Security Consultation', 'CCTV Installation', 'Alarm Systems', 'Access Control', 'Biometric Systems', 'LockSmith Services', 'Safe & Vault Services', 'Cyber Security', 'Background Check', 'Vetting Services', 'Armored Vehicle', 'Cash in Transit', 'Security Training', 'Dog Handling', 'Risk Assessment']
    },
    { 
      id: 'repair', 
      name: 'Appliance & Equipment Repair', 
      keywords: ['repair', 'fix', 'maintenance', 'service', 'appliance', 'equipment', 'fridge', 'refrigerator', 'freezer', 'washer', 'washing machine', 'dryer', 'oven', 'microwave', 'gas cooker', 'electric cooker', 'generator', 'inverter', 'ups', 'solar', 'panel', 'air condition', 'AC', 'split unit', 'ceiling fan', 'standing fan', 'tv', 'television', 'projector', 'printer', 'scanner', 'fax', 'router', 'modem'],
      subcategories: ['Fridge Repair', 'Washing Machine Repair', 'Dryer Repair', 'Gas Cooker Repair', 'Electric Cooker Repair', 'Microwave Repair', 'Generator Repair', 'Inverter Repair', 'UPS Repair', 'Solar Panel Installation', 'AC Repair', 'Fan Repair', 'TV Repair', 'Printer Repair', 'Router Setup', 'Computer Repair', 'Phone Repair', 'Watch Repair', 'Bicycle Repair', 'Motorcycle Repair', 'Generator Maintenance', 'Appliance Maintenance', 'Equipment Servicing']
    },
    { 
      id: 'rental', 
      name: 'Rentals & Leasing', 
      keywords: ['rent', 'rental', 'lease', 'hire', 'temporary', 'apartment', 'flat', 'house', 'office', 'space', 'warehouse', 'store', 'shop', 'event hall', 'equipment', 'machinery', 'vehicle', 'car', 'bus', 'truck', 'van', 'motorcycle', 'bicycle', 'chair', 'table', 'tent', 'canopy', 'sound system', 'projector', 'printer', 'computer', 'laptop'],
      subcategories: ['Apartment Rental', 'House Rental', 'Office Space Rental', 'Shop Rental', 'Warehouse Rental', 'Event Hall Rental', 'Car Rental', 'Bus Rental', 'Truck Rental', 'Equipment Rental', 'Machinery Rental', 'Chair & Table Rental', 'Tent Rental', 'Sound System Rental', 'Projector Rental', 'Computer Rental', 'Costume Rental', 'Formal Wear Rental', 'Photography Equipment Rental', 'Construction Equipment Rental']
    },
    { 
      id: 'sport', 
      name: 'Sports & Fitness', 
      keywords: ['sport', 'sports', 'fitness', 'gym', 'workout', 'training', 'coach', 'personal trainer', 'yoga', 'pilates', 'boxing', 'martial', 'karate', 'judo', 'taekwondo', 'wrestling', 'football', 'soccer', 'basketball', 'tennis', 'swimming', 'running', 'marathon', 'athletics', 'gymnastics', 'volleyball', 'baseball', 'golf', 'cycling', 'hiking'],
      subcategories: ['Gym Membership', 'Personal Training', 'Yoga Classes', 'Pilates Classes', 'Boxing Training', 'Martial Arts', 'Karate', 'Swimming Lessons', 'Football Training', 'Basketball Training', 'Tennis Coaching', 'Athletics Training', 'Gymnastics', 'Volleyball', 'Cycling Tours', 'Hiking Tours', 'Fitness Consulting', 'Nutrition Coaching', 'Sports Massage', 'Sports Equipment Sales', 'Sports Wear', 'Football Agency', 'Talent Scout']
    },
    { 
      id: 'pets', 
      name: 'Pet Services', 
      keywords: ['pet', 'pets', 'dog', 'cat', 'bird', 'fish', 'reptile', 'animal', 'vet', 'veterinary', 'grooming', 'groomer', 'training', 'walker', 'daycare', 'boarding', 'kennel', 'pet food', 'accessories', 'aquarium', 'terrarium', 'pet shop'],
      subcategories: ['Veterinary Services', 'Pet Grooming', 'Pet Daycare', 'Pet Boarding/Kennel', 'Dog Walking', 'Pet Training', 'Pet Food Supply', 'Pet Accessories', 'Aquarium Setup', 'Pet Surgery', 'Pet Vaccination', 'Pest Control (Pets)', 'Pet Photography', 'Pet Transportation', 'Pet Shop', 'Bird Keeping', 'Exotic Pets']
    },
    { 
      id: 'travel', 
      name: 'Travel & Tourism', 
      keywords: ['travel', 'tourism', 'tour', 'trip', 'vacation', 'holiday', 'hotel', 'resort', 'guesthouse', 'inn', 'booking', 'reservation', 'airline', 'flight', 'ticket', 'visa', 'passport', 'immigration', 'immigration', 'ticketing', 'airport', 'pickup', 'transfer', 'shuttle', 'sightseeing', 'excursion', 'safari', 'beach', 'resort', 'package', 'travel agency'],
      subcategories: ['Travel Agency', 'Hotel Booking', 'Flight Booking', 'Visa Processing', 'Passport Services', 'Airport Transfer', 'City Tour', 'Excursion', 'Safari Tour', 'Beach Resort', 'Travel Insurance', 'Hajj & Umrah Services', 'Dubai Visa', 'UK Visa Assistance', 'USA Visa Assistance', 'Canada Visa Assistance', 'Shuttle Services', 'Car Rental/Transport', 'Travel Consulting', 'Itinerary Planning', 'Group Travel', 'Luxury Travel', 'Adventure Tourism']
    },
    { 
      id: 'religion', 
      name: 'Religious & Community Services', 
      keywords: ['church', 'mosque', 'religious', 'spiritual', 'pastor', 'imam', 'priest', 'chaplain', 'counseling', 'spiritual director', 'prayer', 'counselor', 'mentor', 'life coach', 'marriage', 'wedding officiant', 'funeral', 'bereavement', 'grief', 'support group'],
      subcategories: ['Pastoral Counseling', 'Spiritual Counseling', 'Marriage Counseling', 'Grief Counseling', 'Life Coaching', 'Chaplain Services', 'Wedding Officiant', 'Funeral Services', 'Prayer Sessions', 'Religious Education', 'Biblical Studies', 'Islamic Studies', 'Community Outreach', 'Youth Ministry', 'Women Ministry', 'Men Ministry', 'Choir/Music Ministry']
    },
    { 
      id: 'other', 
      name: 'Other Services', 
      keywords: ['other', 'miscellaneous', 'general', 'various', 'multi', 'service'],
      subcategories: ['General Services', 'Errand Services', 'Concierge Services', 'Personal Assistant', 'Virtual Assistant', 'Research Services', 'Data Entry', 'Translation', 'Interpretation', 'Notary Services', 'Apostille Services', 'Document Processing', 'Courier Services', 'Packaging Services', 'Moving Services', 'Junk Removal', 'Recycling Services', 'Waste Management', 'Cleaning Supplies']
    },
  ]

  const priceTypes = [
    { id: 'fixed', name: 'Fixed Price' },
    { id: 'hourly', name: 'Hourly Rate' },
    { id: 'package', name: 'Package Deal' },
    { id: 'per_session', name: 'Per Session' },
    { id: 'per_day', name: 'Per Day' },
    { id: 'per_week', name: 'Per Week' },
    { id: 'per_month', name: 'Per Month' },
    { id: 'negotiable', name: 'Negotiable' },
    { id: 'commission', name: 'Commission Based' },
    { id: 'percentage', name: 'Percentage Based' },
  ]

  const generateServiceWithAI = useCallback(async (title: string) => {
    if (!title || title.length < 2) {
      setDynamicFields([])
      setAiSuggestion(null)
      return
    }

    const lowerTitle = title.toLowerCase().trim()
    
    let bestMatch: { category: any; subcategory: string; score: number } | null = null
    
    for (const category of serviceCategories) {
      let categoryScore = 0
      
      for (const keyword of category.keywords) {
        if (lowerTitle.includes(keyword)) {
          categoryScore += 5
        }
        if (lowerTitle.split(' ').some(word => keyword.includes(word) || word.includes(keyword))) {
          categoryScore += 3
        }
      }
      
      for (const subcategory of category.subcategories) {
        const subLower = subcategory.toLowerCase()
        let subScore = 0
        
        if (subLower.includes(lowerTitle) || lowerTitle.includes(subLower)) {
          subScore = 20
        }
        
        const subWords = subLower.split(' ')
        for (const word of lowerTitle.split(' ')) {
          if (subWords.some(sw => sw.includes(word) && word.length > 2)) {
            subScore += 3
          }
        }
        
        for (const keyword of category.keywords) {
          if (subLower.includes(keyword)) {
            subScore += 2
          }
        }
        
        if (subScore > (bestMatch?.score || 0)) {
          bestMatch = { category, subcategory, score: subScore + categoryScore }
        }
      }
      
      if (categoryScore > (bestMatch?.score || 0)) {
        bestMatch = { category, subcategory: category.subcategories[0], score: categoryScore }
      }
    }

    if (bestMatch && bestMatch.score >= 3) {
      setIsGeneratingAI(true)
      
      setTimeout(() => {
        const suggestion = {
          title: title,
          category: bestMatch!.category.id,
          subcategory: bestMatch!.subcategory,
          price: getEstimatedPrice(bestMatch!.category.id, bestMatch!.subcategory),
          priceType: getPriceType(bestMatch!.category.id),
          priceRange: getPriceRange(bestMatch!.category.id, bestMatch!.subcategory),
          description: generateDescription(title, bestMatch!.category.name, bestMatch!.subcategory),
          estimatedDuration: getDuration(bestMatch!.category.id),
          tags: generateTags(title, bestMatch!.category.name),
          dynamicFields: getDynamicFields(bestMatch!.category.id, bestMatch!.subcategory)
        }
        
        setAiSuggestion(suggestion)
        setDynamicFields(suggestion.dynamicFields)
        
        setNewService(prev => ({
          ...prev,
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          description: suggestion.description,
          price: suggestion.price,
          priceType: suggestion.priceType
        }))
        
        toast.success('AI detected your service! Category and subcategory auto-selected.')
        setIsGeneratingAI(false)
      }, 800)
    } else {
      setDynamicFields([])
      setAiSuggestion(null)
      toast.info('Type more details to get AI suggestions')
    }
  }, [serviceCategories])

  const getEstimatedPrice = (categoryId: string, subcategory: string) => {
    const prices: Record<string, string> = {
      'automotive': '50000',
      'tech': '25000',
      'home': '15000',
      'beauty': '8000',
      'health': '20000',
      'education': '5000',
      'events': '50000',
      'food': '15000',
      'fashion': '10000',
      'construction': '100000',
      'agriculture': '20000',
      'finance': '15000',
      'media': '20000',
      'security': '25000',
      'repair': '10000',
      'rental': '25000',
      'sport': '5000',
      'pets': '5000',
      'travel': '30000',
      'religion': '5000',
      'other': '10000'
    }
    return prices[categoryId] || '10000'
  }

  const getPriceType = (categoryId: string) => {
    const types: Record<string, string> = {
      'automotive': 'fixed',
      'tech': 'project',
      'home': 'fixed',
      'beauty': 'per_session',
      'health': 'per_session',
      'education': 'hourly',
      'events': 'package',
      'food': 'fixed',
      'fashion': 'fixed',
      'construction': 'project',
      'finance': 'fixed',
      'media': 'project',
      'security': 'monthly',
      'repair': 'fixed',
      'rental': 'daily',
      'sport': 'per_session',
      'pets': 'per_session',
      'travel': 'package',
      'religion': 'per_session',
      'other': 'negotiable'
    }
    return types[categoryId] || 'fixed'
  }

  const getPriceRange = (categoryId: string, subcategory: string) => {
    const ranges: Record<string, string> = {
      'automotive': '₦50,000 - ₦5,000,000',
      'tech': '₦15,000 - ₦500,000',
      'home': '₦5,000 - ₦500,000',
      'beauty': '₦3,000 - ₦50,000',
      'health': '₦5,000 - ₦200,000',
      'education': '₦2,000 - ₦30,000/hr',
      'events': '₦50,000 - ₦5,000,000',
      'food': '₦5,000 - ₦500,000',
      'fashion': '₦5,000 - ₦200,000',
      'construction': '₦500,000 - ₦50,000,000',
      'agriculture': '₦20,000 - ₦5,000,000',
      'finance': '₦10,000 - ₦500,000',
      'media': '₦20,000 - ₦1,000,000',
      'security': '₦50,000 - ₦500,000/mo',
      'repair': '₦5,000 - ₦200,000',
      'rental': '₦10,000 - ₦5,000,000',
      'sport': '₦3,000 - ₦50,000',
      'pets': '₦5,000 - ₦50,000',
      'travel': '₦30,000 - ₦5,000,000',
      'religion': '₦5,000 - ₦100,000',
      'other': 'Negotiable'
    }
    return ranges[categoryId] || 'Contact for pricing'
  }

  const getDuration = (categoryId: string) => {
    const durations: Record<string, string> = {
      'automotive': '1-14 days',
      'tech': '1-90 days',
      'home': '1-30 days',
      'beauty': '30 mins - 4 hours',
      'health': '30 mins - 2 hours',
      'education': '1-2 hours/session',
      'events': '1-3 days',
      'food': '1-7 days',
      'fashion': '1-14 days',
      'construction': '1-180 days',
      'agriculture': 'Ongoing',
      'finance': '1-30 days',
      'media': '1-30 days',
      'security': 'Monthly contract',
      'repair': '1-3 days',
      'rental': 'Daily/Monthly',
      'sport': '1-2 hours',
      'pets': '1-4 hours',
      'travel': '1-30 days',
      'religion': 'Varies',
      'other': 'Varies'
    }
    return durations[categoryId] || 'Contact for duration'
  }

  const generateDescription = (title: string, category: string, subcategory: string) => {
    return `Professional ${title} services in ${subcategory} category. We provide quality, reliable, and affordable ${title.toLowerCase()} services in Nigeria. Contact us for a free consultation.`
  }

  const generateTags = (title: string, category: string) => {
    const tags = [
      title.toLowerCase().replace(/\s+/g, '-'),
      category.toLowerCase().replace(/\s+/g, '-'),
      'nigeria',
      'naija',
      'reliable',
      'professional'
    ]
    return tags.slice(0, 5)
  }

  const getDynamicFields = (categoryId: string, subcategory: string): DynamicField[] => {
    const commonFields: DynamicField[] = [
      { id: 'serviceArea', label: 'Service Area (City/LGA)', type: 'text', placeholder: 'e.g., Lagos Island, Ikeja', required: true },
      { id: 'workingHours', label: 'Working Hours', type: 'text', placeholder: 'e.g., Mon-Sat 8AM-6PM' },
      { id: 'experience', label: 'Years of Experience', type: 'select', options: ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'], required: true }
    ]

    const categorySpecificFields: Record<string, DynamicField[]> = {
      'automotive': [
        { id: 'license', label: 'Business License Number', type: 'text', placeholder: 'e.g., MOT-XXXXX' },
        { id: 'workshop', label: 'Workshop Location', type: 'text', placeholder: 'Workshop address' },
        { id: 'specialization', label: 'Specialization', type: 'select', options: ['Sales Only', 'Repairs Only', 'Both Sales & Repairs'], required: true },
        { id: 'brands', label: 'Brands Handled', type: 'text', placeholder: 'e.g., Toyota, Honda, BMW' }
      ],
      'tech': [
        { id: 'portfolio', label: 'Portfolio Link', type: 'text', placeholder: 'e.g., yourwebsite.com' },
        { id: 'tools', label: 'Tools/Technologies', type: 'text', placeholder: 'e.g., React, Node.js, Python' },
        { id: 'deliverables', label: 'Deliverables', type: 'textarea', placeholder: 'What will client receive?' }
      ],
      'beauty': [
        { id: 'mobile', label: 'Mobile Services', type: 'select', options: ['Yes - Additional Fee', 'Yes - Free', 'No - Shop Only'], required: true },
        { id: 'products', label: 'Products Used', type: 'textarea', placeholder: 'Professional brands used' },
        { id: 'appointments', label: 'Booking Method', type: 'select', options: ['WhatsApp', 'Phone Call', 'Walk-in', 'Online Booking'] }
      ],
      'health': [
        { id: 'license', label: 'Professional License', type: 'text', placeholder: 'Medical license number' },
        { id: 'emergency', label: 'Emergency Services', type: 'select', options: ['Yes', 'No'] },
        { id: 'homeVisit', label: 'Home Visit', type: 'select', options: ['Available', 'Not Available', 'Extra Charge'] }
      ],
      'events': [
        { id: 'teamSize', label: 'Team Size', type: 'select', options: ['Solo', '2-5 people', '6-10 people', '10+ people'] },
        { id: 'equipment', label: 'Own Equipment', type: 'select', options: ['Yes - Included', 'Yes - Extra Charge', 'No - Rent Required'] },
        { id: 'previousEvents', label: 'Previous Major Events', type: 'textarea', placeholder: 'List notable events handled' }
      ],
      'food': [
        { id: 'foodType', label: 'Cuisine Type', type: 'select', options: ['Nigerian', 'Continental', 'Chinese', 'Indian', 'Italian', 'Mixed', 'Other'] },
        { id: 'delivery', label: 'Delivery Available', type: 'select', options: ['Yes - Free', 'Yes - Fee Applies', 'Pickup Only'] },
        { id: 'minOrder', label: 'Minimum Order', type: 'number', placeholder: 'Minimum order quantity' }
      ],
      'construction': [
        { id: 'license', label: 'Contractor License', type: 'text', placeholder: 'License number' },
        { id: 'completedProjects', label: 'Completed Projects', type: 'number', placeholder: 'Number of projects completed' },
        { id: 'insurance', label: 'Insurance Coverage', type: 'select', options: ['Yes - Full', 'Yes - Basic', 'No'] },
        { id: 'warranty', label: 'Work Warranty', type: 'select', options: ['Yes', 'No', 'Discuss per project'] }
      ],
      'finance': [
        { id: 'certification', label: 'Professional Certification', type: 'text', placeholder: 'e.g., ICAN, CITN, ACCA' },
        { id: 'specialization', label: 'Specialization', type: 'select', options: ['Tax', 'Audit', 'Consulting', 'Business Registration', 'All'] }
      ],
      'repair': [
        { id: 'warranty', label: 'Work Warranty', type: 'select', options: ['Yes - 30 days', 'Yes - 90 days', 'No'] },
        { id: 'diagnostics', label: 'Diagnostics Fee', type: 'text', placeholder: 'e.g., ₦5,000 (refundable)' },
        { id: 'brands', label: 'Brands Handled', type: 'text', placeholder: 'e.g., Samsung, LG, Philips' }
      ]
    }

    return [...(categorySpecificFields[categoryId] || []), ...commonFields]
  }

  const applyAISuggestion = () => {
    if (!aiSuggestion) return
    
    setNewService(prev => ({
      ...prev,
      title: aiSuggestion.title,
      category: aiSuggestion.category,
      subcategory: aiSuggestion.subcategory,
      description: aiSuggestion.description,
      price: aiSuggestion.price,
      priceType: aiSuggestion.priceType
    }))
    setDynamicFields(aiSuggestion.dynamicFields)
    toast.success('AI suggestion applied!')
  }

  useEffect(() => {
    const currentUser = storage.getUser()
    if (!currentUser || currentUser.userType !== 'provider') {
      router.push('/auth/login')
      return
    }
    setUser(currentUser)

    // Load provider data
    const savedWallet = storage.getWallet()
    setWallet(savedWallet || { balance: 0, transactions: [] })

    // Load services from Firebase API
    const loadServices = async () => {
      try {
        const response = await axios.get(`${API_BASE}/services/${currentUser.id}`)
        if (response.data.success && response.data.services.length > 0) {
          setServices(response.data.services)
          storage.setServices(response.data.services)
        } else {
          // Fallback to localStorage
          const savedServices = storage.getServices()
          setServices(savedServices)
          // Notify if no services
          if (!savedServices || savedServices.length === 0) {
            setTimeout(() => {
              toast.info('👋 Welcome! Please add your first service to get started.', { duration: 5000 })
            }, 1000)
          }
        }
      } catch (error) {
        // Fallback to localStorage
        const savedServices = storage.getServices()
        setServices(savedServices)
        // Notify if no services
        if (!savedServices || savedServices.length === 0) {
          setTimeout(() => {
            toast.info('👋 Welcome! Please add your first service to get started.', { duration: 5000 })
          }, 1000)
        }
      }
    }
    loadServices()
  }, [router])

  const handleLogout = () => {
    storage.clearUser()
    router.push('/')
  }

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newService.title || !newService.price || !newService.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const selectedCat = serviceCategories.find(c => c.id === newService.category)
    
    const serviceData = {
      title: newService.title,
      category: newService.category,
      categoryName: selectedCat?.name || '',
      subcategory: newService.subcategory,
      price: parseFloat(newService.price),
      priceType: newService.priceType,
      description: newService.description,
      serviceArea: newService.serviceArea,
      experience: newService.experience,
      certifications: newService.certifications,
      workingHours: newService.workingHours,
      highlights: newService.highlights,
      active: true,
      views: 0,
    }

    try {
      if (editingService) {
        const response = await axios.put(`${API_BASE}/services/${editingService.id}`, serviceData)
        if (response.data.success) {
          const updated = services.map(s => 
            s.id === editingService.id ? { ...s, ...serviceData } : s
          )
          setServices(updated)
          storage.setServices(updated)
          toast.success('Service updated successfully!')
        }
      } else {
        const response = await axios.post(`${API_BASE}/services`, {
          userId: user?.id,
          service: serviceData
        })
        if (response.data.success) {
          const savedService = response.data.service
          const updated = [...services, savedService]
          setServices(updated)
          storage.setServices(updated)
          toast.success('Service created successfully!', {
            description: 'Your profile is now live. Click here to preview.',
            action: {
              label: 'Preview',
              onClick: () => handlePreviewProfile()
            }
          })
        }
      }
    } catch (error) {
      // Fallback to localStorage if API fails
      if (editingService) {
        const updated = services.map(s => 
          s.id === editingService.id ? { ...s, ...serviceData } : s
        )
        setServices(updated)
        storage.setServices(updated)
        toast.success('Service updated (saved locally)')
      } else {
        const service = {
          id: Date.now(),
          ...serviceData,
          createdAt: new Date().toISOString(),
        }
        const updated = [...services, service]
        setServices(updated)
        storage.setServices(updated)
        toast.success('Service created (saved locally)')
      }
    }
    
    setNewService({ title: '', category: '', subcategory: '', price: '', priceType: 'fixed', description: '', serviceArea: '', experience: '', certifications: '', workingHours: '', highlights: '' })
    setShowServiceForm(false)
    setEditingService(null)
    setDynamicFields([])
    setAiSuggestion(null)
  }

  const handleEditService = (service: any) => {
    setEditingService(service)
    setNewService({
      title: service.title || '',
      category: service.category || '',
      subcategory: service.subcategoryName || '',
      price: String(service.price || ''),
      priceType: service.priceType || 'fixed',
      description: service.description || '',
      serviceArea: service.serviceArea || '',
      experience: service.experience || '',
      certifications: service.certifications || '',
      workingHours: service.workingHours || '',
      highlights: service.highlights || '',
    })
    setShowServiceForm(true)
    setAiSuggestion(null)
    setDynamicFields([])
  }

  const handleDeleteService = async (id: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`${API_BASE}/services/${id}`)
      } catch (error) {
        // Continue with local delete even if API fails
      }
      const updated = services.filter(s => s.id !== id)
      setServices(updated)
      storage.setServices(updated)
      toast.success('Service deleted successfully')
    }
  }

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_BASE}/users/${user?.id}`, businessSettings)
    } catch (error) {
      // Continue with local save if API fails
    }
    storage.set('providerSettings', businessSettings)
    storage.setUser({ ...user, ...businessSettings })
    setUser({ ...user, ...businessSettings })
    toast.success('Settings saved successfully!')
  }

  const handlePreviewProfile = () => {
    const currentWebsite = storage.getCurrentWebsite()
    const profileSlug = currentWebsite?.companyName || user?.fullName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || user?.id
    const profileUrl = `/profile-site/${profileSlug}`
    window.open(profileUrl, '_blank')
  }

  const totalEarnings = wallet.transactions
    .filter((t: any) => t.type === 'earnings')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.png" alt="Bixfind Logo" className="h-12 w-12" />
            <div>
              <div className="text-2xl font-bold text-blue-600">BIXFIND</div>
              <span className="text-xs text-gray-600">Provider</span>
            </div>
          </a>
          <a href="https://bixfind.indevs.in" className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold">
            <Globe className="w-4 h-4" />
            Home
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-1 lg:mt-2">Welcome, {user.fullName}!</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Mobile: Dropdown */}
          <div className="lg:hidden w-full">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm"
            >
              <span className="font-semibold">{tabs.find(t => t.id === activeTab)?.label}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                      activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Vertical Tabs */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-4 py-3 text-left rounded-lg flex items-center gap-3 transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-w-0">

        {/* Overview Tab */}
        {activeTab === 'overview' && (() => {
          const currentWebsite = storage.getCurrentWebsite()
          const websiteSlug = currentWebsite?.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 
                              user?.fullName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
          const fullWebsiteUrl = `https://bixfind.indevs.in/profile-site/${websiteSlug}`
          const isPublished = currentWebsite?.isPublished
          
          const shareOnWhatsApp = () => {
            const text = `Check out my business website: ${fullWebsiteUrl}`
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
          }
          
          const shareOnInstagram = () => {
            toast.info('Copy the link and share it on Instagram: ' + fullWebsiteUrl)
            navigator.clipboard.writeText(fullWebsiteUrl)
          }
          
          const shareOnTwitter = () => {
            const text = `Check out my business website!`
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullWebsiteUrl)}`, '_blank')
          }
          
          const shareOnFacebook = () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullWebsiteUrl)}`, '_blank')
          }
          
          return (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm">Total Earnings</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₦{totalEarnings.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm">Wallet Balance</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">₦{wallet.balance.toLocaleString()}</p>
                    </div>
                    <Wallet className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm">Active Services</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{services.length}</p>
                    </div>
                    <Package className="w-10 h-10 text-purple-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm">Total Views</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{services.reduce((s, sv) => s + sv.views, 0)}</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-orange-500 opacity-50" />
                  </div>
                </div>
              </div>
              
              {/* Website URL Card with Social Sharing */}
              {websiteSlug && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Your Mini Website
                        {isPublished && <span className="bg-green-500 text-xs px-2 py-0.5 rounded-full">Live</span>}
                      </h3>
                      <p className="text-purple-100 text-sm break-all font-mono">{fullWebsiteUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(fullWebsiteUrl)
                          toast.success('URL copied!')
                        }}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                      >
                        Copy URL
                      </button>
                      <a 
                        href={fullWebsiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white text-purple-600 hover:bg-purple-50 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Site
                      </a>
                    </div>
                  </div>
                  
                  {/* Social Sharing */}
                  <div className="border-t border-white/20 pt-4">
                    <h4 className="text-sm font-semibold mb-3">Share Your Website</h4>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={shareOnWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                      <button 
                        onClick={shareOnInstagram}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram
                      </button>
                      <button 
                        onClick={shareOnTwitter}
                        className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter/X
                      </button>
                      <button 
                        onClick={shareOnFacebook}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        })()}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Sales Analytics</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Export Report
              </button>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">₦{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Orders Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{sales.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm">This Month</p>
                <p className="text-2xl font-bold text-green-600 mt-2">₦0</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Service</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No sales yet. Your completed orders will appear here.
                        </td>
                      </tr>
                    ) : (
                      sales.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-4 py-3">{s.service}</td>
                          <td className="px-4 py-3">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{s.customer}</td>
                          <td className="px-4 py-3 text-right font-semibold">₦{Number(s.amount).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              s.status === 'completed' ? 'bg-green-100 text-green-700' :
                              s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{s.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <button
              onClick={() => setShowServiceForm(!showServiceForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>

            {showServiceForm && (
              <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Service</h3>
                  <button
                    onClick={() => {
                      setShowServiceForm(false)
                      setNewService({ title: '', category: '', subcategory: '', price: '', priceType: 'fixed', description: '', serviceArea: '', experience: '', certifications: '', workingHours: '', highlights: '' })
                      setDynamicFields([])
                      setAiSuggestion(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* AI Info Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">AI-Powered Service Builder</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Simply type your service title below. Our AI will automatically determine the best category, subcategory, and fill in all other details for Nigerian market!
                  </p>
                </div>

                {/* Step 1: Service Title Only */}
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (newService.title && !aiSuggestion) {
                    generateServiceWithAI(newService.title)
                  }
                }} className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {editingService ? 'Editing Service' : 'Step 1: Enter Service Title'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newService.title}
                      onChange={(e) => {
                        setNewService({...newService, title: e.target.value})
                        setAiSuggestion(null)
                        setDynamicFields([])
                      }}
                      placeholder="e.g., Plumbing Repairs, Hair Styling, CCTV Installation"
                      className="w-full px-4 py-4 text-lg border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                    {isGeneratingAI ? (
                      <Loader2 className="w-6 h-6 text-purple-600 absolute right-4 top-1/2 -translate-y-1/2 animate-spin" />
                    ) : newService.title && !aiSuggestion && !editingService && (
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Generate
                      </button>
                    )}
                  </div>
                  {editingService ? (
                    <p className="text-xs text-blue-600 mt-2">Editing existing service. You can update the details below.</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">Press Enter or click Generate to let AI auto-fill the details</p>
                  )}
                </form>

                {/* Step 2: AI Generated Details */}
                {aiSuggestion && (
                  <>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">AI has generated these details for you!</span>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Based on your service "{newService.title}", we've auto-selected the best category and generated all details.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-white/50 rounded px-3 py-2">
                          <span className="text-gray-500 block text-xs">Category</span>
                          <span className="font-semibold">{serviceCategories.find(c => c.id === aiSuggestion.category)?.name || aiSuggestion.category}</span>
                        </div>
                        <div className="bg-white/50 rounded px-3 py-2">
                          <span className="text-gray-500 block text-xs">Subcategory</span>
                          <span className="font-semibold">{aiSuggestion.subcategory}</span>
                        </div>
                        <div className="bg-white/50 rounded px-3 py-2">
                          <span className="text-gray-500 block text-xs">Est. Price</span>
                          <span className="font-semibold">{aiSuggestion.priceRange}</span>
                        </div>
                        <div className="bg-white/50 rounded px-3 py-2">
                          <span className="text-gray-500 block text-xs">Duration</span>
                          <span className="font-semibold">{aiSuggestion.estimatedDuration}</span>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleAddService} className="space-y-4">
                      {/* Category (auto-filled) */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                          <select
                            value={newService.category}
                            onChange={(e) => setNewService({...newService, category: e.target.value, subcategory: ''})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            required
                          >
                            <option value="">Select Category</option>
                            {serviceCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory <span className="text-red-500">*</span></label>
                          <select
                            value={newService.subcategory}
                            onChange={(e) => setNewService({...newService, subcategory: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            required
                            disabled={!newService.category}
                          >
                            <option value="">Select Subcategory</option>
                            {newService.category && serviceCategories.find(c => c.id === newService.category)?.subcategories.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Price (₦) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={newService.price}
                            onChange={(e) => setNewService({...newService, price: e.target.value})}
                            placeholder="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Price Type <span className="text-red-500">*</span></label>
                          <select
                            value={newService.priceType}
                            onChange={(e) => setNewService({...newService, priceType: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            required
                          >
                            {priceTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                          <select
                            value={newService.experience}
                            onChange={(e) => setNewService({...newService, experience: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          >
                            <option value="">Select</option>
                            <option value="0-1">0-1 years</option>
                            <option value="1-3">1-3 years</option>
                            <option value="3-5">3-5 years</option>
                            <option value="5-10">5-10 years</option>
                            <option value="10+">10+ years</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                        <textarea
                          value={newService.description}
                          onChange={(e) => setNewService({...newService, description: e.target.value})}
                          placeholder="Describe your service..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={3}
                          required
                        />
                      </div>

                      {/* AI Extra Fields */}
                      {dynamicFields.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Additional Details (Auto-generated)
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {dynamicFields.map(field => (
                              <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === 'select' ? (
                                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                    <option value="">Select...</option>
                                    {field.options?.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location & Contact */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Service Area (City/LGA)</label>
                          <input
                            type="text"
                            value={newService.serviceArea}
                            onChange={(e) => setNewService({...newService, serviceArea: e.target.value})}
                            placeholder="e.g., Lagos Island, Ikeja"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Working Hours</label>
                          <input
                            type="text"
                            value={newService.workingHours}
                            onChange={(e) => setNewService({...newService, workingHours: e.target.value})}
                            placeholder="e.g., Mon-Sat 8AM-6PM"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          <Zap className="w-5 h-5" />
                          Create Service
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowServiceForm(false)
                            setNewService({ title: '', category: '', subcategory: '', price: '', priceType: 'fixed', description: '', serviceArea: '', experience: '', certifications: '', workingHours: '', highlights: '' })
                            setDynamicFields([])
                            setAiSuggestion(null)
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {services.map(service => (
                <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100 text-sm font-medium">{service.categoryName}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${service.active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{service.title}</h3>
                    <p className="text-blue-600 text-sm font-medium mb-3">{service.subcategoryName}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="font-semibold text-gray-900 ml-1">
                          ₦{Number(service.price).toLocaleString()} {service.priceType === 'hourly' ? '/hr' : service.priceType === 'package' ? '(pkg)' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Experience:</span>
                        <span className="font-semibold text-gray-900 ml-1">{service.experience || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Area:</span>
                        <span className="font-semibold text-gray-900 ml-1">{service.serviceArea || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <span className="font-semibold text-gray-900 ml-1">{service.views}</span>
                      </div>
                    </div>

                    {service.certifications && (
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">Certifications:</span>
                        <p className="text-sm text-gray-700">{service.certifications}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex border-t">
                    <button 
                      onClick={() => handlePreviewProfile()}
                      className="flex-1 py-2 text-green-600 font-medium hover:bg-green-50 transition flex items-center justify-center gap-1 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Profile
                    </button>
                    <button 
                      onClick={() => handleEditService(service)}
                      className="flex-1 py-2 text-blue-600 font-medium hover:bg-blue-50 transition flex items-center justify-center gap-1 text-sm border-l"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="flex-1 py-2 text-red-600 font-medium hover:bg-red-50 transition flex items-center justify-center gap-1 text-sm border-l"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg shadow p-8">
              <p className="text-blue-100 text-sm">Available Balance</p>
              <p className="text-5xl font-bold mt-2">₦{wallet.balance.toLocaleString()}</p>
              <button 
                onClick={() => toast.info('Withdrawal feature coming soon! You will be able to withdraw funds to your bank account.')}
                className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
              >
                Withdraw Funds
              </button>
            </div>
          </div>
        )}

        {/* Website Tab */}
        {activeTab === 'website' && (() => {
          const currentWebsite = storage.getCurrentWebsite()
          const websiteSlug = currentWebsite?.companyName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 
                              user?.fullName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
          const fullWebsiteUrl = `https://bixfind.indevs.in/profile-site/${websiteSlug}`
          const isPublished = currentWebsite?.isPublished
          const hasWebsite = !!currentWebsite?.displayName
          
          const shareOnWhatsApp = () => {
            const text = `Check out my business website: ${fullWebsiteUrl}`
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
          }
          
          const shareOnInstagram = () => {
            toast.info('Copy the link and share it on Instagram: ' + fullWebsiteUrl)
            navigator.clipboard.writeText(fullWebsiteUrl)
          }
          
          const shareOnTwitter = () => {
            const text = `Check out my business website!`
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullWebsiteUrl)}`, '_blank')
          }
          
          const shareOnFacebook = () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullWebsiteUrl)}`, '_blank')
          }
          
          return (
            <div className="space-y-6">
              {/* Website URL Display */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your Mini Website</h2>
                    <p className="text-purple-100">
                      {isPublished ? 'Your website is live!' : hasWebsite ? 'Edit and publish your website' : 'Build and publish your website'}
                    </p>
                  </div>
                  <Link 
                    href="/website-builder"
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2"
                  >
                    <span>{hasWebsite ? 'Edit Website' : 'Open Builder'}</span>
                  </Link>
                </div>
              </div>

              {/* Published URL Card */}
              {websiteSlug && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Your Website URL
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-sm break-all">
                      {fullWebsiteUrl}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(fullWebsiteUrl)
                        toast.success('URL copied to clipboard!')
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap"
                    >
                      Copy URL
                    </button>
                    <a 
                      href={fullWebsiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 justify-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Site
                    </a>
                  </div>
                  
                  {/* Social Sharing */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Share Your Website</h4>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={shareOnWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </button>
                      <button 
                        onClick={shareOnInstagram}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Instagram
                      </button>
                      <button 
                        onClick={shareOnTwitter}
                        className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter/X
                      </button>
                      <button 
                        onClick={shareOnFacebook}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook
                      </button>
                    </div>
                  </div>
                  
                  {isPublished && (
                    <div className="mt-4 flex items-center gap-2 text-green-600">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">Live and accessible to customers</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6">
                <Link href="/website-builder" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-blue-500">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{hasWebsite ? 'Edit Theme' : 'Customize Theme'}</h3>
                  <p className="text-gray-600 text-sm">Choose colors, fonts, and layout style</p>
                </Link>
                <Link href="/website-builder" className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-green-500">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Edit Content</h3>
                  <p className="text-gray-600 text-sm">Update your bio, services, and contact info</p>
                </Link>
                <a 
                  href={fullWebsiteUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-500"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Preview Site</h3>
                  <p className="text-gray-600 text-sm">See how your website looks</p>
                </a>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="font-bold text-green-800">{hasWebsite ? 'Update Your Website' : 'Build Your Mini Website'}</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Use our website builder to create a professional mini website that showcases your services. Share your unique URL with customers!
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link 
                    href="/website-builder"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                  >
                    {hasWebsite ? 'Edit Website' : 'Start Building'}
                  </Link>
                  {websiteSlug && (
                    <a 
                      href={fullWebsiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-gray-50 text-green-700 border border-green-300 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Live Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Inventory Management</h2>
              <a 
                href="/website-builder"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add from Website Builder
              </a>
            </div>
            
            {inventory.length > 0 || (storage.get('provider_inventory') || []).length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(inventory.length > 0 ? inventory : storage.get('provider_inventory') || []).map((item: any, index: number) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.stock || 0}</td>
                          <td className="px-4 py-3">₦{item.price?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${item.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No inventory items yet.</p>
                <p className="text-sm text-gray-400">Add products in Website Builder to track inventory.</p>
                <a href="/website-builder" className="inline-block mt-4 text-blue-600 hover:underline">
                  Go to Website Builder
                </a>
              </div>
            )}
          </div>
        )}

        {/* Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Business Ledger</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => toast.info('Income tracking will be available soon!')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Income
                </button>
                <button 
                  onClick={() => toast.info('Expense tracking will be available soon!')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Expense
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700">Total Income</p>
                <p className="text-2xl font-bold text-green-800">₦0</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-700">Total Expenses</p>
                <p className="text-2xl font-bold text-red-800">₦0</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700">Net Profit</p>
                <p className="text-2xl font-bold text-blue-800">₦0</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No transactions yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Service Receipts</h2>
              <button 
                onClick={() => {
                  setSelectedReceipt({
                    id: 'RCP-' + Date.now(),
                    date: new Date().toISOString(),
                    customer: '',
                    service: '',
                    amount: 0
                  })
                  setShowReceiptModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Generate Receipt
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Generate professional receipts for your services. Receipts can be downloaded as PDF or sent to customers.</p>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Receipt #</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receipts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No receipts generated yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Hotel QR Tab */}
        {activeTab === 'hotel' && (
          <HotelQRManager user={user} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Business Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input 
                  type="text" 
                  value={businessSettings.businessName || user?.fullName || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                <input 
                  type="email" 
                  value={businessSettings.email || user?.email || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={businessSettings.phone || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="+234 xxx xxx xxxx" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={businessSettings.whatsapp || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, whatsapp: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="+234 xxx xxx xxxx" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea 
                  value={businessSettings.address || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3} 
                  placeholder="Your business address..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                <input 
                  type="text" 
                  value={businessSettings.workingHours || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, workingHours: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g., Mon-Sat 8AM-6PM" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                <textarea 
                  value={businessSettings.description || ''}
                  onChange={(e) => setBusinessSettings({...businessSettings, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  rows={3} 
                  placeholder="Tell customers about your business..." 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle</label>
                  <input 
                    type="text" 
                    value={businessSettings.instagram || ''}
                    onChange={(e) => setBusinessSettings({...businessSettings, instagram: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="@yourbusiness" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X Handle</label>
                  <input 
                    type="text" 
                    value={businessSettings.twitter || ''}
                    onChange={(e) => setBusinessSettings({...businessSettings, twitter: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="@yourbusiness" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Handle</label>
                  <input 
                    type="text" 
                    value={businessSettings.tiktok || ''}
                    onChange={(e) => setBusinessSettings({...businessSettings, tiktok: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="@yourbusiness" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Snapchat Handle</label>
                  <input 
                    type="text" 
                    value={businessSettings.snapchat || ''}
                    onChange={(e) => setBusinessSettings({...businessSettings, snapchat: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="@yourbusiness" 
                  />
                </div>
              </div>

              {/* Safety Verification Section */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200">
                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Safety Verification & Trust Badges
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Complete verification to earn trust badges that reassure customers of your legitimacy and safety.
                </p>

                {/* Verification Badges */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border-2 ${businessSettings.idVerified ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {businessSettings.idVerified ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="font-semibold">ID Verified</span>
                    </div>
                    <p className="text-xs text-gray-600">Government-issued ID confirmed</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 ${businessSettings.policeClearance ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {businessSettings.policeClearance ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="font-semibold">Police Clearance</span>
                    </div>
                    <p className="text-xs text-gray-600">Background check completed</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 ${businessSettings.insuranceStatus !== 'none' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {businessSettings.insuranceStatus !== 'none' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="font-semibold">Insured</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {businessSettings.insuranceStatus === 'full' ? 'Full Coverage' : businessSettings.insuranceStatus === 'basic' ? 'Basic Coverage' : 'No insurance'}
                    </p>
                  </div>
                </div>

                {/* Verification Forms */}
                <div className="space-y-4">
                  {/* ID Verification */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">1. Identity Verification</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number (NIN, Driver's License, or Passport)</label>
                        <input 
                          type="text" 
                          value={businessSettings.idNumber || ''}
                          onChange={(e) => setBusinessSettings({...businessSettings, idNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          placeholder="Enter your ID number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Document</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setBusinessSettings({...businessSettings, idImage: reader.result as string})
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Police Clearance */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-3">2. Police Clearance Certificate</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Police Clearance Certificate</label>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setBusinessSettings({...businessSettings, policeClearanceDoc: reader.result as string, policeClearance: true})
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Get this from your local police station</p>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-3">3. Insurance Coverage</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Level</label>
                        <select 
                          value={businessSettings.insuranceStatus}
                          onChange={(e) => setBusinessSettings({...businessSettings, insuranceStatus: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="none">No Insurance</option>
                          <option value="basic">Basic Coverage</option>
                          <option value="full">Full Coverage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Insurance Certificate</label>
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setBusinessSettings({...businessSettings, insuranceDoc: reader.result as string})
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-3">4. Emergency Contact</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                        <input 
                          type="text" 
                          value={businessSettings.emergencyContact || ''}
                          onChange={(e) => setBusinessSettings({...businessSettings, emergencyContact: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" 
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                        <input 
                          type="tel" 
                          value={businessSettings.emergencyPhone || ''}
                          onChange={(e) => setBusinessSettings({...businessSettings, emergencyPhone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" 
                          placeholder="+234 xxx xxx xxxx"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Years in Business */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years in Business</label>
                    <input 
                      type="number" 
                      min="0"
                      value={businessSettings.yearsInBusiness || 0}
                      onChange={(e) => setBusinessSettings({...businessSettings, yearsInBusiness: parseInt(e.target.value) || 0})}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  Save Settings
                </button>
                <button 
                  onClick={handlePreviewProfile}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Preview Profile
                </button>
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
