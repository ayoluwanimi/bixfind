import { getPaletteColors, DEFAULT_PALETTE } from '@bixfind/design-tokens/src/builder'
import { getFontPairById, DEFAULT_FONT_PAIR } from '@bixfind/design-tokens/src/builder'
import { getTemplateById, DEFAULT_TEMPLATE, DENSITY_CONFIGS, type Density } from '@bixfind/design-tokens/src/builder'

export interface ProviderTheme {
  palette: string[]
  customColors: Record<string, string> | null
  fontPairId: string
  templateId: string
  density: Density
  fontFamily: string
  headingFontFamily: string
  borderRadius: string
  navStyle: string
  heroLayout: string
  cardStyle: string
}

export interface MiniWebsiteData {
  template_id?: string
  density?: Density
  font_pair_id?: string
  palette_id?: string
  custom_colors?: Record<string, string> | null
  published?: boolean
}

const DEFAULT_THEME: ProviderTheme = {
  palette: DEFAULT_PALETTE.colors,
  customColors: null,
  fontPairId: DEFAULT_FONT_PAIR.id,
  templateId: DEFAULT_TEMPLATE.id,
  density: 'comfortable',
  fontFamily: DEFAULT_FONT_PAIR.body.family,
  headingFontFamily: DEFAULT_FONT_PAIR.heading.family,
  borderRadius: DEFAULT_TEMPLATE.borderRadius,
  navStyle: DEFAULT_TEMPLATE.navStyle,
  heroLayout: DEFAULT_TEMPLATE.heroLayout,
  cardStyle: DEFAULT_TEMPLATE.cardStyle,
}

export function getProviderTheme(website?: MiniWebsiteData | null): ProviderTheme {
  if (!website) return DEFAULT_THEME

  const template = website.template_id ? getTemplateById(website.template_id) : null
  const fontPair = website.font_pair_id ? getFontPairById(website.font_pair_id) : null

  return {
    palette: website.palette_id ? getPaletteColors(website.palette_id) : DEFAULT_THEME.palette,
    customColors: website.custom_colors ?? DEFAULT_THEME.customColors,
    fontPairId: website.font_pair_id ?? DEFAULT_THEME.fontPairId,
    templateId: website.template_id ?? DEFAULT_THEME.templateId,
    density: website.density ?? DEFAULT_THEME.density,
    fontFamily: fontPair?.body.family ?? DEFAULT_THEME.fontFamily,
    headingFontFamily: fontPair?.heading.family ?? DEFAULT_THEME.headingFontFamily,
    borderRadius: template?.borderRadius ?? DEFAULT_THEME.borderRadius,
    navStyle: template?.navStyle ?? DEFAULT_THEME.navStyle,
    heroLayout: template?.heroLayout ?? DEFAULT_THEME.heroLayout,
    cardStyle: template?.cardStyle ?? DEFAULT_THEME.cardStyle,
  }
}

export function getDensityStyles(density: Density) {
  return DENSITY_CONFIGS[density]
}
