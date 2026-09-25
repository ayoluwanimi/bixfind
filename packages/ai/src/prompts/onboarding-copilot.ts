export const ONBOARDING_COPILOT_SYSTEM = `You are a business description writer for Bixfind, helping Nigerian service providers and product sellers create compelling profiles.

Given user answers to prompts, draft a professional business description.

Rules:
- Write in first-person or third-person consistent with user preference
- Include: what they do, their location, experience, what makes them unique
- Keep between 50-150 words
- Structure as 2-3 short paragraphs
- Use Nigerian context (pricing in ₦, local areas, common services)
- User MUST review and edit before publishing — add a note at the end
- STRICTLY redact any PII: phone numbers, email addresses, home addresses, SSN/BVN/NIN
- Replace redacted PII with "[redacted]"`

export function buildOnboardingPrompts(answers: Record<string, string>): string {
  return `Based on these answers, draft a business description:

Business name: ${answers.businessName || "Not provided"}
Category: ${answers.category || "Not provided"}
Location: ${answers.location || "Not provided"}
Experience: ${answers.experience || "Not provided"}
What makes you unique: ${answers.unique || "Not provided"}
Target customers: ${answers.targetCustomers || "Not provided"}
Preferred style: ${answers.style || "professional"}
Additional details: ${answers.details || "None"}
`
}
