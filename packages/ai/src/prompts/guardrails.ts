import { z } from "zod"

export const PromptFirewallSchema = z.object({
  safe: z.boolean(),
  reason: z.string().optional(),
  strippedPrompt: z.string().optional(),
})

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+(instructions|prompts?|directions)/i,
  /system\s*:\s*/i,
  /you\s+are\s+(now\s+)?(an?\s+)?(free\s+)?(unconstrained\s+)?(chat)?(bot)?/i,
  /jailbreak/i,
  /d\?j\s*:?\s*/i,
  /new\s+prompt\s*:/i,
  /override\s+(mode|instructions|protocol)/i,
  /your\s+(instructions|prompts?|system)/i,
  /<'|'>|\$\{.*\}|`.*`/,
]

export function containsPII(text: string): { found: boolean; types: string[] } {
  const types: string[] = []

  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, label: "SSN/NIN" },
    { regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, label: "credit_card" },
    { regex: /\b\d{10,11}\b/, label: "phone_number" },
    { regex: /\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/, label: "email" },
    { regex: /\bBVN\s*:?\s*\d{10}\b/i, label: "BVN" },
    { regex: /\bNIN\s*:?\s*\d{11}\b/i, label: "NIN" },
    { regex: /\b\d{5,6}\b/, label: "postal_code" },
  ]

  for (const { regex, label } of patterns) {
    if (regex.test(text)) {
      types.push(label)
    }
  }

  return { found: types.length > 0, types }
}

export function redactPII(text: string): string {
  let result = text
  result = result.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, "[redacted_card]")
  result = result.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, "[redacted_id]")
  result = result.replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted_email]")
  result = result.replace(/\bBVN\s*:?\s*\d{10}\b/gi, "BVN: [redacted]")
  result = result.replace(/\bNIN\s*:?\s*\d{11}\b/gi, "NIN: [redacted]")
  return result
}

export function stripInjectionPatterns(prompt: string): { safe: boolean; stripped: string } {
  const matches: string[] = []
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      matches.push(pattern.source)
    }
  }
  const stripped = prompt.replace(
    new RegExp(INJECTION_PATTERNS.map((p) => p.source).join("|"), "gi"),
    "",
  )
  return { safe: matches.length === 0, stripped }
}

export function isSafePrompt(text: string): boolean {
  const { safe } = stripInjectionPatterns(text)
  return safe
}

export function moderateOutput(text: string): { flagged: boolean; categories: string[] } {
  const categories: string[] = []

  const harmfulPatterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /\b(hate|racist|sexist|discriminat)\w*/i, label: "hate_speech" },
    { regex: /\b(violence|kill|attack|weapon)\w*/i, label: "violence" },
    { regex: /\b(spam|crypt.?o|free money|click here|win (prize|money))\w*/i, label: "spam" },
    { regex: /\b(nudity|nsfw|explicit|porn)\w*/i, label: "nsfw" },
    { regex: /\b(fraud|scam|fake|phony|illegal)\w*/i, label: "fraud" },
  ]

  for (const { regex, label } of harmfulPatterns) {
    if (regex.test(text)) {
      categories.push(label)
    }
  }

  return { flagged: categories.length > 0, categories }
}
