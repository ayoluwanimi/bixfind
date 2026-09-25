import { z } from "zod"

export interface CostEntry {
  profileId?: string
  sessionId: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  durationMs: number
  cost: number
  endpoint: string
}

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-vision": { input: 0.005, output: 0.015 },
  "text-embedding-3-small": { input: 0.00002, output: 0 },
  "claude-3-5-haiku-latest": { input: 0.0008, output: 0.004 },
  "claude-3-5-sonnet-latest": { input: 0.003, output: 0.015 },
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const rates = COST_PER_1K_TOKENS[model] ?? COST_PER_1K_TOKENS["gpt-4o-mini"]
  const inputCost = (promptTokens / 1000) * rates.input
  const outputCost = (completionTokens / 1000) * rates.output
  return inputCost + outputCost
}

export function trackCost(entry: CostEntry): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[CostTracker] ${entry.model}: $${entry.cost.toFixed(6)} (${entry.totalTokens} tokens)`)
  }

  if (typeof fetch !== "undefined") {
    fetch("/api/ai/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => {})
  }
}

export const CostTrackingSchema = z.object({
  entries: z.array(z.object({
    totalTokens: z.number(),
    totalCost: z.number(),
    model: z.string(),
    timestamp: z.string().datetime(),
  })),
  budgetLimit: z.number().optional(),
  budgetExceeded: z.boolean().default(false),
})

export function checkBudget(env: string, dailyCost: number): boolean {
  const budgets: Record<string, number> = {
    development: 5,
    staging: 20,
    production: 200,
  }
  const limit = budgets[env] ?? budgets.development
  return dailyCost >= limit
}
