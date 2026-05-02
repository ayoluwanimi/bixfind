import { NextResponse } from 'next/server'

// Product seller categories (don't charge per hour)
const PRODUCT_SELLER_CATEGORIES = [
  'car dealer', 'automotive sales', 'gadget sales', 'phone sales', 'laptop sales',
  'electronics', 'fashion', 'clothing', 'shoes', 'bags', 'accessories',
  'jewelry', 'cosmetics', 'beauty products', 'food', 'restaurant',
  'grocery', 'supermarket', 'pharmacy', 'books', 'sports equipment',
  'furniture', 'home appliances', 'mobile accessories', 'computer accessories',
  'gaming', 'toys', 'baby products', 'pet supplies', 'automotive parts'
]

// Service categories (typically charge per hour/project)
const SERVICE_CATEGORIES = [
  'plumbing', 'electrical', 'cleaning', 'painting', 'carpentry',
  'hair styling', 'tutoring', 'fitness training', 'photography',
  'consulting', 'repair', 'maintenance', 'installation', 'delivery',
  'catering', 'event planning', 'coaching', 'therapy'
]

const pricingKnowledge: Record<string, { priceType: string; description: string }> = {
  'car dealer': { priceType: 'fixed', description: 'Price varies by vehicle - typically ₦500,000 - ₦50,000,000' },
  'gadget sales': { priceType: 'fixed', description: 'Price varies by product - typically ₦5,000 - ₦500,000' },
  'mobile accessories': { priceType: 'fixed', description: 'Price varies by accessory - typically ₦500 - ₦50,000' },
  'electronics': { priceType: 'fixed', description: 'Price varies by item - typically ₦10,000 - ₦1,000,000' },
  'plumbing': { priceType: 'hourly', description: 'Typically ₦5,000 - ₦25,000 per hour, or fixed for projects' },
  'electrical': { priceType: 'hourly', description: 'Typically ₦8,000 - ₦30,000 per hour' },
  'cleaning': { priceType: 'fixed', description: 'Typically ₦5,000 - ₦50,000 per session' },
  'hair styling': { priceType: 'fixed', description: 'Typically ₦3,000 - ₦25,000 per session' },
  'tutoring': { priceType: 'hourly', description: 'Typically ₦2,000 - ₦15,000 per hour' },
  'fitness training': { priceType: 'hourly', description: 'Typically ₦5,000 - ₦20,000 per session' },
  'photography': { priceType: 'package', description: 'Typically ₦50,000 - ₦500,000 per event' },
  'consulting': { priceType: 'hourly', description: 'Typically ₦10,000 - ₦100,000 per hour' },
  'car repairs': { priceType: 'fixed', description: 'Quote based on diagnosis - typically ₦10,000 - ₦500,000' },
  'painting': { priceType: 'fixed', description: 'Typically ₦50,000 - ₦500,000 per project' },
}

const productKeywords = [
  'sell', 'sale', 'buy', 'shop', 'store', 'dealer', 'reseller', 'distributor',
  'product', 'item', 'gadget', 'phone', 'laptop', 'car', 'vehicle', 'clothes',
  'fashion', 'accessory', 'electronics', 'device', 'wholesale', 'retail'
]

const serviceKeywords = [
  'service', 'repair', 'fix', 'maintenance', 'installation', 'cleaning',
  'consulting', 'training', 'tutoring', 'styling', 'design', 'development'
]

function detectPricingModel(serviceTitle: string): { isProductSeller: boolean; priceType: string; priceRange: string } {
  const lowerTitle = serviceTitle.toLowerCase()
  
  // Check for product seller indicators
  const productScore = productKeywords.filter(kw => lowerTitle.includes(kw)).length
  const serviceScore = serviceKeywords.filter(kw => lowerTitle.includes(kw)).length
  
  // Check for specific product seller categories
  for (const cat of PRODUCT_SELLER_CATEGORIES) {
    if (lowerTitle.includes(cat) || cat.includes(lowerTitle)) {
      return { 
        isProductSeller: true, 
        priceType: 'fixed',
        priceRange: pricingKnowledge[cat]?.description || 'Price varies by product'
      }
    }
  }
  
  // Check for specific service categories
  for (const cat of SERVICE_CATEGORIES) {
    if (lowerTitle.includes(cat)) {
      const info = pricingKnowledge[cat] || { priceType: 'hourly', description: 'Contact for pricing' }
      return { 
        isProductSeller: false, 
        priceType: info.priceType,
        priceRange: info.description
      }
    }
  }
  
  // Default based on keyword scores
  if (productScore > serviceScore) {
    return { isProductSeller: true, priceType: 'fixed', priceRange: 'Price varies by product' }
  }
  
  return { isProductSeller: false, priceType: 'hourly', priceRange: 'Contact for pricing' }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, query, category, serviceName } = body

    if (type === 'search') {
      // Smart categorization using web knowledge patterns
      const searchTerms = query.toLowerCase().split(' ')
      const matchedCategories: { name: string; score: number; type: string }[] = []
      
      const allCategories = [
        { name: 'Automotive & Vehicles', keywords: ['car', 'auto', 'vehicle', 'motor', 'driving', 'dealership', 'tokunbo', 'automobile'], categoryType: 'product' },
        { name: 'Technology & IT', keywords: ['tech', 'computer', 'laptop', 'phone', 'software', 'web', 'app', 'gadget', 'accessory', 'phone repair'], categoryType: 'mixed' },
        { name: 'Home Services', keywords: ['plumbing', 'pipe', 'electrical', 'painting', 'cleaning', 'carpentry', 'furniture'], categoryType: 'service' },
        { name: 'Beauty & Personal Care', keywords: ['hair', 'salon', 'beauty', 'makeup', 'skincare', 'nails', 'barber', 'styling'], categoryType: 'service' },
        { name: 'Fashion & Clothing', keywords: ['fashion', 'clothing', 'clothes', 'dress', 'tailor', 'boutique', 'shoes', 'bags'], categoryType: 'product' },
        { name: 'Electronics Sales', keywords: ['electronics', 'tv', 'fridge', 'generator', 'inverter', 'solar'], categoryType: 'product' },
        { name: 'Food & Catering', keywords: ['food', 'catering', 'cook', 'chef', 'restaurant', 'meal'], categoryType: 'product' },
        { name: 'Education & Training', keywords: ['tutor', 'teaching', 'lesson', 'class', 'course', 'training'], categoryType: 'service' },
        { name: 'Repair Services', keywords: ['repair', 'fix', 'maintenance', 'service'], categoryType: 'service' },
        { name: 'Health & Medical', keywords: ['health', 'medical', 'doctor', 'pharmacy', 'therapy'], categoryType: 'service' },
      ]

      for (const cat of allCategories) {
        let score = 0
        for (const term of searchTerms) {
          if (cat.keywords.some(k => k.includes(term) || term.includes(k))) {
            score += 3
          }
          // Check for multi-word matches
          const combined = searchTerms.join(' ')
          for (const kw of cat.keywords) {
            if (combined.includes(kw) || kw.includes(combined)) {
              score += 5
            }
          }
        }
        if (score > 0) {
          matchedCategories.push({ name: cat.name, score, type: cat.categoryType })
        }
      }

      matchedCategories.sort((a, b) => b.score - a.score)

      const topMatch = matchedCategories[0]
      let suggestion = ''
      
      if (topMatch) {
        if (topMatch.type === 'product') {
          suggestion = `This looks like a product-based business. Pricing will be per-product, not hourly.`
        } else if (topMatch.type === 'service') {
          suggestion = `This looks like a service-based business. Consider hourly or project-based pricing.`
        } else {
          suggestion = `This can be both product and service.`
        }
      }

      return NextResponse.json({
        success: true,
        results: matchedCategories.slice(0, 5).map(c => c.name),
        suggestion: suggestion || 'Browse all categories to find your match.'
      })
    }

    if (type === 'description') {
      const pricing = detectPricingModel(serviceName || category || '')
      
      const description = pricing.isProductSeller
        ? `We sell quality ${serviceName || category} products. Visit our store or contact us for current prices and availability.`
        : `Professional ${serviceName || category} services. We provide quality work with customer satisfaction guaranteed.`

      return NextResponse.json({
        success: true,
        description,
        tags: [pricing.isProductSeller ? 'products' : 'services', 'nigeria', 'quality'],
        estimatedDuration: pricing.isProductSeller ? 'N/A' : 'Varies by project',
        priceRange: pricing.priceRange,
        priceType: pricing.priceType,
        isProductSeller: pricing.isProductSeller
      })
    }

    if (type === 'categorize') {
      // Smart categorization endpoint
      const pricing = detectPricingModel(serviceName || query || '')
      
      // Determine best category based on service name
      let bestCategory = 'Other Services'
      const lowerName = (serviceName || query || '').toLowerCase()
      
      const categoryMap: Record<string, string[]> = {
        'Automotive & Vehicles': ['car', 'auto', 'vehicle', 'motor', 'tokunbo', 'automobile', 'dealer'],
        'Technology & IT': ['phone', 'laptop', 'computer', 'tech', 'gadget', 'accessory', 'software'],
        'Fashion & Clothing': ['clothes', 'fashion', 'shoes', 'bags', 'accessory', 'tailor'],
        'Electronics Sales': ['electronics', 'tv', 'fridge', 'generator', 'inverter'],
        'Home Services': ['plumbing', 'electrical', 'painting', 'cleaning', 'repair'],
        'Beauty & Personal Care': ['hair', 'beauty', 'makeup', 'nails', 'salon'],
        'Food & Catering': ['food', 'catering', 'restaurant', 'cook'],
      }
      
      for (const [cat, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(k => lowerName.includes(k))) {
          bestCategory = cat
          break
        }
      }

      return NextResponse.json({
        success: true,
        category: bestCategory,
        priceType: pricing.priceType,
        priceRange: pricing.priceRange,
        isProductSeller: pricing.isProductSeller,
        message: pricing.isProductSeller 
          ? 'This is a product-based business. Prices are per-product, not hourly.'
          : 'This is a service-based business. Consider hourly or project pricing.'
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'AI service failed' }, { status: 500 })
  }
}
