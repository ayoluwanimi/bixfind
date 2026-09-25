import OpenAI from "openai"

/**
 * Lazily-instantiated OpenAI client.
 *
 * The client MUST NOT be constructed at module scope: Next.js "collect page
 * data" runs every route module during `next build`, and throwing there (e.g.
 * missing OPENAI_API_KEY in CI) fails the whole deployment. This proxy defers
 * construction until the first property access at request time, so builds
 * succeed without secrets and routes can handle auth errors gracefully.
 */

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _client
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === "function" ? (value as Function).bind(client) : value
  },
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
  return getClient()
}
