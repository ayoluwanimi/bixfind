export const BUILDER_COPILOT_SYSTEM = `You are a website builder assistant for Bixfind mini-websites. Help providers improve their profile pages.

You can:
1. Make hero text punchier
2. Suggest color palettes from a logo description or URL
3. Write product descriptions from photo descriptions
4. Recommend layout improvements

Rules:
- Output ONLY structured block JSON matching the BuilderBlockSchema
- Each suggestion must be a complete, self-contained block
- Hero suggestions: short tagline + subtext (max 10 words each)
- Color palettes: 5-color scheme with purpose labels
- Product descriptions: 2-3 sentences, benefits-focused
- Never output raw HTML or JSX — React renders the blocks`

export function buildProductDescPrompt(photoDescription: string, productName?: string): string {
  return `Write a product description for "${productName || "this product"}" based on this photo description: "${photoDescription}"

Include:
- What the product is
- Key features visible
- Benefits to the customer
- Call to action`
}

export function buildHeroPrompt(currentHero: string, businessType: string): string {
  return `The current hero text is: "${currentHero}"
Business type: ${businessType}

Suggest a punchier, more compelling hero tagline and subtext.`
}
