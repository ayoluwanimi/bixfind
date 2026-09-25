export interface PaletteColor {
  name: string
  colors: string[]
  description: string
}

export interface PaletteGroup {
  mood: 'Bold' | 'Elegant' | 'Warm' | 'Modern'
  palettes: PaletteColor[]
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const l1 = relativeLuminance(r1, g1, b1)
  const l2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWCAG(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA', largeText = false): boolean {
  const ratio = contrastRatio(foreground, background)
  if (level === 'AAA') return largeText ? ratio >= 4.5 : ratio >= 7
  return largeText ? ratio >= 3 : ratio >= 4.5
}

export function suggestAccessibleVariant(baseColor: string, bgColor: string, target = 4.5): string {
  const [r, g, b] = hexToRgb(baseColor)
  const bgLum = relativeLuminance(...hexToRgb(bgColor))
  let cr = contrastRatio(baseColor, bgColor)
  if (cr >= target) return baseColor
  const steps = [5, 10, 15, 20, 25, 30, 35, 40]
  for (const step of steps) {
    const darker = `#${Math.max(0, r - step).toString(16).padStart(2, '0')}${Math.max(0, g - step).toString(16).padStart(2, '0')}${Math.max(0, b - step).toString(16).padStart(2, '0')}`
    cr = contrastRatio(darker, bgColor)
    if (cr >= target) return darker
    const lighter = `#${Math.min(255, r + step).toString(16).padStart(2, '0')}${Math.min(255, g + step).toString(16).padStart(2, '0')}${Math.min(255, b + step).toString(16).padStart(2, '0')}`
    cr = contrastRatio(lighter, bgColor)
    if (cr >= target) return lighter
  }
  return '#000000'
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    mood: 'Bold',
    palettes: [
      { name: 'Lagos Sunset', colors: ['#FF4500', '#FF6B35', '#FFD700', '#FF8C00', '#DC143C'], description: 'Vibrant sunset hues inspired by Lagos coastline' },
      { name: 'Crimson Velvet', colors: ['#8B0000', '#DC143C', '#FF1493', '#C71585', '#DB7093'], description: 'Deep reds with rich velvety tones' },
      { name: 'Neon Owambe', colors: ['#FF00FF', '#00FF00', '#FFFF00', '#00FFFF', '#FF6600'], description: 'Electric party neon from Owambe nights' },
      { name: 'Electric Cyan', colors: ['#00E5FF', '#00B8D4', '#0097A7', '#00BCD4', '#18FFFF'], description: 'High-voltage cyan for modern brands' },
      { name: 'Magenta Surge', colors: ['#E91E63', '#F06292', '#EC407A', '#D81B60', '#C2185B'], description: 'Bold magenta gradients with energy' },
      { name: 'Acid Lime', colors: ['#CDDC39', '#D4E157', '#C0CA33', '#AFB42B', '#9E9D24'], description: 'Sharp lime greens for edgy brands' },
    ],
  },
  {
    mood: 'Elegant',
    palettes: [
      { name: 'Champagne Gold', colors: ['#F7E7CE', '#E8C872', '#C9A94E', '#B8860B', '#8B6914'], description: 'Luxurious gold tones for premium brands' },
      { name: 'Royal Plum', colors: ['#4A0E4E', '#6A1B9A', '#8E24AA', '#AB47BC', '#CE93D8'], description: 'Regal purple family for sophisticated elegance' },
      { name: 'Onyx Ivory', colors: ['#1A1A2E', '#2D2D44', '#E8E8E8', '#F5F5F5', '#FFFFFF'], description: 'Timeless black and white editorial' },
      { name: 'Rose Quartz', colors: ['#F7CAC9', '#E8A2A2', '#D48383', '#C46B6B', '#B04E4E'], description: 'Soft rose tones with vintage warmth' },
      { name: 'Forest Emerald', colors: ['#004D40', '#00695C', '#00897B', '#26A69A', '#4DB6AC'], description: 'Deep forest greens for organic elegance' },
      { name: 'Midnight Sapphire', colors: ['#0D1440', '#1A237E', '#283593', '#3F51B5', '#5C6BC0'], description: 'Deep blue sapphire for trust and luxury' },
    ],
  },
  {
    mood: 'Warm',
    palettes: [
      { name: 'Terracotta Sun', colors: ['#E2725B', '#D4634A', '#C0543C', '#B04A33', '#9E3D27'], description: 'Earthy terracotta inspired by Sahel sunsets' },
      { name: 'Amber Spice', colors: ['#FF8F00', '#FFA000', '#FFB300', '#FFC107', '#FFD54F'], description: 'Warm amber with golden spice tones' },
      { name: 'Saharan Sand', colors: ['#D4B896', '#C4A882', '#B4976E', '#A4865A', '#8B7340'], description: 'Sandy neutrals from the Sahara desert' },
      { name: 'Mango Cream', colors: ['#FFD180', '#FFC107', '#FFB300', '#FFA000', '#FF8F00'], description: 'Sweet mango tones with creamy warmth' },
      { name: 'Henna Russet', colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B8860B'], description: 'Traditional henna-dyed russet tones' },
      { name: 'Hibiscus Coral', colors: ['#FF6F61', '#FF8A7A', '#FFA093', '#E65A50', '#CC473D'], description: 'Vibrant coral recalling tropical hibiscus' },
    ],
  },
  {
    mood: 'Modern',
    palettes: [
      { name: 'Glass Navy', colors: ['#0A1628', '#1A2A4A', '#2A3F6A', '#4A6FA5', '#6A8FC5'], description: 'Default — frosted navy with glass-morphism accents' },
      { name: 'Cloud Pearl', colors: ['#F0F4F8', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B'], description: 'Clean pearl grays for minimal interfaces' },
      { name: 'Slate Mint', colors: ['#0F172A', '#1E293B', '#334155', '#14B8A6', '#2DD4BF'], description: 'Dark slate paired with fresh mint accents' },
      { name: 'Carbon Lime', colors: ['#1C1C1C', '#2D2D2D', '#3D3D3D', '#A3E635', '#84CC16'], description: 'Carbon black with electric lime highlights' },
      { name: 'Aurora Pink', colors: ['#1A0A1E', '#2D0A3E', '#5B1A6A', '#FF1E75', '#FF6BA6'], description: 'Cosmic pink aurora on deep space' },
      { name: 'Iceberg Blue', colors: ['#E8F4FD', '#D0E8F7', '#A8D0EE', '#6AB0E0', '#3A90D0'], description: 'Cool iceberg blues for clean technology brands' },
    ],
  },
]

export const DEFAULT_PALETTE = PALETTE_GROUPS[3].palettes[0]

export function getPaletteByName(name: string): PaletteColor | undefined {
  for (const group of PALETTE_GROUPS) {
    const found = group.palettes.find(p => p.name === name)
    if (found) return found
  }
}

export function getAllPalettes(): PaletteColor[] {
  return PALETTE_GROUPS.flatMap(g => g.palettes)
}

export function getPaletteColors(paletteId: string): string[] {
  const palette = getPaletteByName(paletteId)
  return palette ? palette.colors : DEFAULT_PALETTE.colors
}
