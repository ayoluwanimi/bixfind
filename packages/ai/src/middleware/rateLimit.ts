export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  reset: number
}

const TIERS: Record<string, { limit: number; window: number }> = {
  free: { limit: 20, window: 60 },
  paid: { limit: 200, window: 60 },
}

const inMemory: Map<string, { count: number; resetAt: number }> = new Map()

function getClient() {
  const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit")
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis")

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: true,
  })
}

let upstashClient: ReturnType<typeof getClient> | null = null

function getInMemory() {
  if (!upstashClient) {
    try {
      upstashClient = getClient()
    } catch {
      return null
    }
  }
  return upstashClient
}

export async function checkRateLimit(
  userId: string,
  tier: keyof typeof TIERS = "free",
): Promise<RateLimitResult> {
  const upstash = getInMemory()

  if (upstash) {
    const { success, remaining, limit, reset } = await upstash.limit(userId)
    return { success, remaining, limit, reset }
  }

  const config = TIERS[tier]
  const now = Math.floor(Date.now() / 1000)
  const key = `${userId}:${tier}`

  const entry = inMemory.get(key)

  if (!entry || now >= entry.resetAt) {
    inMemory.set(key, { count: 1, resetAt: now + config.window })
    return { success: true, remaining: config.limit - 1, limit: config.limit, reset: now + config.window }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, limit: config.limit, reset: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, limit: config.limit, reset: entry.resetAt }
}
