import { z } from "zod"

export const ColorPaletteSchema = z.object({
  primary: z.string().describe("Primary brand color hex"),
  secondary: z.string().describe("Secondary brand color hex"),
  accent: z.string().describe("Accent color hex"),
  background: z.string().describe("Background color hex"),
  text: z.string().describe("Text color hex"),
})

export const HeroBlockSchema = z.object({
  type: z.literal("hero"),
  tagline: z.string().max(60).describe("Punchy hero tagline"),
  subtext: z.string().max(120).describe("Supporting subtitle"),
})

export const ProductDescriptionBlockSchema = z.object({
  type: z.literal("product_description"),
  name: z.string().describe("Product name"),
  description: z.string().describe("Benefits-focused description, 2-3 sentences"),
  keyFeatures: z.array(z.string()).max(5).describe("Key product features"),
})

export const PaletteBlockSchema = z.object({
  type: z.literal("palette"),
  palette: ColorPaletteSchema,
  description: z.string().describe("Why this palette suits this business"),
})

export const LayoutSuggestionSchema = z.object({
  type: z.literal("layout"),
  section: z.string().describe("Which section to modify"),
  suggestion: z.string().describe("What to change and why"),
  priority: z.enum(["low", "medium", "high"]),
})

export const BuilderBlockSchema = z.discriminatedUnion("type", [
  HeroBlockSchema,
  ProductDescriptionBlockSchema,
  PaletteBlockSchema,
  LayoutSuggestionSchema,
])

export const BuilderResponseSchema = z.object({
  blocks: z.array(BuilderBlockSchema).max(5),
})

export type BuilderBlock = z.infer<typeof BuilderBlockSchema>
export type BuilderResponse = z.infer<typeof BuilderResponseSchema>
export type ColorPalette = z.infer<typeof ColorPaletteSchema>
