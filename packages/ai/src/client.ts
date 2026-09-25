import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const DEFAULT_MODELS = {
  fast: process.env.AI_FAST_MODEL ?? "gpt-4o-mini",
  reasoning: process.env.AI_REASONING_MODEL ?? "gpt-4o",
  embedding: process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  vision: process.env.AI_VISION_MODEL ?? "gpt-4o",
}

export interface AICallOptions {
  model?: string
  maxTokens?: number
  timeout?: number
  temperature?: number
  cacheKey?: string
  schema?: Record<string, unknown>
}

export function createAIClient() {
  return openai
}
