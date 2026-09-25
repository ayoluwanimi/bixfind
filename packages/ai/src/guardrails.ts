export function containsPII(text: string): boolean {
  const patterns = [
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN
    /\b\d{16}\b/, // credit card
  ]
  return patterns.some((p) => p.test(text))
}

export function isSafePrompt(text: string): boolean {
  const blocked = ["ignore previous instructions", "system prompt", "jailbreak"]
  return !blocked.some((w) => text.toLowerCase().includes(w))
}
