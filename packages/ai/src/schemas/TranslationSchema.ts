import { z } from "zod"

export const TranslationSchema = z.object({
  translatedText: z.string(),
  sourceLanguage: z.string(),
  sourceLanguageName: z.string(),
  targetLanguage: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  alternativeTranslations: z.array(z.string()).max(2).optional(),
})

export const SupportedLanguages = ["en", "pcm", "yo", "ig", "ha"] as const

export const TranslationRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  targetLanguage: z.enum(SupportedLanguages),
  sourceLanguage: z.enum(SupportedLanguages).optional(),
})

export type Translation = z.infer<typeof TranslationSchema>
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>
