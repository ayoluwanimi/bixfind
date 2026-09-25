import { redactPII, containsPII } from "../prompts/guardrails"

export interface PIIRedactionResult {
  original: string
  redacted: string
  foundTypes: string[]
  wasRedacted: boolean
}

export function redactInput(text: string): PIIRedactionResult {
  const { found, types } = containsPII(text)

  if (!found) {
    return { original: text, redacted: text, foundTypes: [], wasRedacted: false }
  }

  return {
    original: text,
    redacted: redactPII(text),
    foundTypes: types,
    wasRedacted: true,
  }
}

export function wrapWithPIIRedaction<T>(handler: (text: string) => Promise<T>): (text: string) => Promise<T> {
  return async (text: string) => {
    const { redacted, wasRedacted, foundTypes } = redactInput(text)

    if (wasRedacted) {
      console.warn(`[PIIRedaction] Redacted ${foundTypes.join(", ")} from input`)
    }

    return handler(redacted)
  }
}
