export interface FontPair {
  id: string
  name: string
  heading: {
    family: string
    googleFont: string
    weight: string[]
  }
  body: {
    family: string
    googleFont: string
    weight: string[]
  }
  category: string
  description: string
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'clash-inter',
    name: 'Clash Display × Inter',
    heading: { family: 'Clash Display', googleFont: 'Clash+Display', weight: ['400', '500', '600', '700'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Sans',
    description: 'Bold geometric headline meets clean versatile body — default pair',
  },
  {
    id: 'cabinet-satoshi',
    name: 'Cabinet Grotesk × Satoshi',
    heading: { family: 'Cabinet Grotesk', googleFont: 'Cabinet+Grotesk', weight: ['400', '500', '700'] },
    body: { family: 'Satoshi', googleFont: 'Satoshi', weight: ['300', '400', '500', '700'] },
    category: 'Sans',
    description: 'Retro grotesk headline with modern rounded body',
  },
  {
    id: 'fraunces-inter',
    name: 'Fraunces × Inter',
    heading: { family: 'Fraunces', googleFont: 'Fraunces', weight: ['300', '400', '600', '700', '900'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Serif-Sans',
    description: 'Elegant old-style serif headline with neutral sans body',
  },
  {
    id: 'sora-outfit',
    name: 'Sora × Outfit',
    heading: { family: 'Sora', googleFont: 'Sora', weight: ['300', '400', '600', '700'] },
    body: { family: 'Outfit', googleFont: 'Outfit', weight: ['300', '400', '500'] },
    category: 'Sans',
    description: 'Geometric premium feel with ultra-clean body',
  },
  {
    id: 'playfair-lato',
    name: 'Playfair Display × Lato',
    heading: { family: 'Playfair Display', googleFont: 'Playfair+Display', weight: ['400', '600', '700', '900'] },
    body: { family: 'Lato', googleFont: 'Lato', weight: ['300', '400', '700'] },
    category: 'Serif-Sans',
    description: 'Classic editorial serif headline with friendly sans body',
  },
  {
    id: 'space-space',
    name: 'Space Grotesk × Space Mono',
    heading: { family: 'Space Grotesk', googleFont: 'Space+Grotesk', weight: ['400', '500', '600', '700'] },
    body: { family: 'Space Mono', googleFont: 'Space+Mono', weight: ['400', '700'] },
    category: 'Mono',
    description: 'Tech-forward monospace pair for developer brands',
  },
  {
    id: 'bricolage-mona',
    name: 'Bricolage Grotesque × Mona Sans',
    heading: { family: 'Bricolage Grotesque', googleFont: 'Bricolage+Grotesque', weight: ['400', '600', '700', '800'] },
    body: { family: 'Mona Sans', googleFont: 'Mona+Sans', weight: ['400', '500', '600'] },
    category: 'Sans',
    description: 'Expressive variable grotesque for modern brands',
  },
  {
    id: 'newsreader-archivo',
    name: 'Newsreader × Archivo',
    heading: { family: 'Newsreader', googleFont: 'Newsreader', weight: ['400', '500', '600', '700'] },
    body: { family: 'Archivo', googleFont: 'Archivo', weight: ['300', '400', '500', '600', '700'] },
    category: 'Serif-Sans',
    description: 'Warm serif for storytelling with sturdy sans body',
  },
  {
    id: 'synonym-satoshi',
    name: 'Synonym × Satoshi',
    heading: { family: 'Synonym', googleFont: 'Synonym', weight: ['400', '500', '600', '700'] },
    body: { family: 'Satoshi', googleFont: 'Satoshi', weight: ['300', '400', '500', '700'] },
    category: 'Sans',
    description: 'Warm rounded headlines with refined body text',
  },
  {
    id: 'bebas-inter',
    name: 'Bebas Neue × Inter',
    heading: { family: 'Bebas Neue', googleFont: 'Bebas+Neue', weight: ['400'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Display-Sans',
    description: 'All-caps impact headline with clean body',
  },
  {
    id: 'instrument-inter',
    name: 'Instrument Serif × Inter',
    heading: { family: 'Instrument Serif', googleFont: 'Instrument+Serif', weight: ['400'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Serif-Sans',
    description: 'Slender serif headline with versatile sans body',
  },
  {
    id: 'poppins-nunito',
    name: 'Poppins × Nunito',
    heading: { family: 'Poppins', googleFont: 'Poppins', weight: ['400', '500', '600', '700', '800'] },
    body: { family: 'Nunito', googleFont: 'Nunito', weight: ['300', '400', '600', '700'] },
    category: 'Sans',
    description: 'Rounded contemporary pair with friendly personality',
  },
  {
    id: 'jost-manrope',
    name: 'Jost × Manrope',
    heading: { family: 'Jost', googleFont: 'Jost', weight: ['400', '500', '600', '700'] },
    body: { family: 'Manrope', googleFont: 'Manrope', weight: ['400', '500', '600', '700'] },
    category: 'Sans',
    description: 'Modern geometric pair with European character',
  },
  {
    id: 'zodiak-satoshi',
    name: 'Zodiak × Satoshi',
    heading: { family: 'Zodiak', googleFont: 'Zodiak', weight: ['400', '700', '900'] },
    body: { family: 'Satoshi', googleFont: 'Satoshi', weight: ['300', '400', '500', '700'] },
    category: 'Serif-Sans',
    description: 'Dramatic serif headlines balanced by clean sans',
  },
  {
    id: 'panchang-outfit',
    name: 'Panchang × Outfit',
    heading: { family: 'Panchang', googleFont: 'Panchang', weight: ['400', '500', '600', '700'] },
    body: { family: 'Outfit', googleFont: 'Outfit', weight: ['300', '400', '500'] },
    category: 'Display-Sans',
    description: 'Ultra-bold geometric display with airy body',
  },
  {
    id: 'switzer-satoshi',
    name: 'Switzer × Satoshi',
    heading: { family: 'Switzer', googleFont: 'Switzer', weight: ['300', '400', '500', '600', '700'] },
    body: { family: 'Satoshi', googleFont: 'Satoshi', weight: ['300', '400', '500', '700'] },
    category: 'Sans',
    description: 'Swiss-inspired neutral with versatile body',
  },
  {
    id: 'boska-inter',
    name: 'Boska × Inter',
    heading: { family: 'Boska', googleFont: 'Boska', weight: ['400', '500', '600', '700'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Serif-Sans',
    description: 'Elegant serif storytelling with Inter reliability',
  },
  {
    id: 'cabinet-sora',
    name: 'Cabinet Grotesk × Sora',
    heading: { family: 'Cabinet Grotesk', googleFont: 'Cabinet+Grotesk', weight: ['400', '500', '700'] },
    body: { family: 'Sora', googleFont: 'Sora', weight: ['300', '400', '600', '700'] },
    category: 'Sans',
    description: 'Grotesk headline with premium geometric body',
  },
  {
    id: 'satoshi-inter',
    name: 'Satoshi × Inter',
    heading: { family: 'Satoshi', googleFont: 'Satoshi', weight: ['300', '400', '500', '700', '900'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Sans',
    description: 'Clean satoshi headlines with inter readability',
  },
  {
    id: 'bricolage-inter',
    name: 'Bricolage Grotesque × Inter',
    heading: { family: 'Bricolage Grotesque', googleFont: 'Bricolage+Grotesque', weight: ['400', '600', '700', '800'] },
    body: { family: 'Inter', googleFont: 'Inter', weight: ['300', '400', '500', '600', '700'] },
    category: 'Sans',
    description: 'Expressive yet clean all-rounder pair',
  },
]

export const DEFAULT_FONT_PAIR = FONT_PAIRS[0]

export function getFontPairById(id: string): FontPair | undefined {
  return FONT_PAIRS.find(f => f.id === id)
}
