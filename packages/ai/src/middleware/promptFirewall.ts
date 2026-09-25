import { PromptFirewallSchema } from "../prompts/guardrails"

const INJECTION_PATTERNS = [
  { pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts?|directions|messages|context)/i, label: "ignore_previous" },
  { pattern: /system\s*:\s*/i, label: "system_override" },
  { pattern: /you\s+are\s+(now\s+)?(an?\s+)?(free\s+)?(unconstrained\s+)?(chat)?(bot)?/i, label: "identity_override" },
  { pattern: /jailbreak/i, label: "jailbreak" },
  { pattern: /d\?j\s*:?\s*/i, label: "dan_mode" },
  { pattern: /override\s+(mode|instructions|protocol|system)/i, label: "override_attempt" },
  { pattern: /new\s+prompt\s*:/i, label: "prompt_injection" },
  { pattern: /your\s+(instructions|prompts?|system|rules)/i, label: "meta_instruction" },
  { pattern: /<'|'>|\$\{.*?\}|`[^`]*`/i, label: "template_injection" },
  { pattern: /(?:role|act)\s*:\s*(?:system|assistant|user)/i, label: "role_override" },
  { pattern: /\[system\]|\[INST\]|<\|im_start\|>/i, label: "token_injection" },
]

export function analyzePrompt(prompt: string): { safe: boolean; violations: string[]; stripped: string } {
  const violations: string[] = []

  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      violations.push(label)
    }
  }

  const stripped = violations.length > 0
    ? prompt.replace(
        new RegExp(INJECTION_PATTERNS.map((p) => `(?:${p.pattern.source})`).join("|"), "gi"),
        "",
      )
    : prompt

  return { safe: violations.length === 0, violations, stripped }
}

export function wrapWithFirewall<T>(handler: (prompt: string) => Promise<T>): (prompt: string) => Promise<T> {
  return async (prompt: string) => {
    const { safe, violations, stripped } = analyzePrompt(prompt)

    if (!safe) {
      console.warn(`[PromptFirewall] Blocked prompt: ${violations.join(", ")}`)
    }

    return handler(stripped)
  }
}
