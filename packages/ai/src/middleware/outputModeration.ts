import { moderateOutput } from "../prompts/guardrails"

export interface ModerationResult {
  text: string
  flagged: boolean
  categories: string[]
  action: "pass" | "block" | "flag"
}

export function moderatePublicOutput(text: string): ModerationResult {
  const { flagged, categories } = moderateOutput(text)

  if (!flagged) {
    return { text, flagged: false, categories: [], action: "pass" }
  }

  const hardBlockCategories = ["nsfw", "violence", "hate_speech"]
  const isHardBlock = categories.some((c) => hardBlockCategories.includes(c))

  return {
    text: isHardBlock ? "[Content blocked by moderation]" : text,
    flagged: true,
    categories,
    action: isHardBlock ? "block" : "flag",
  }
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { text: imageUrl, flagged: false, categories: [], action: "pass" }
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: [{ image_url: imageUrl }] }),
    })

    const data = await res.json()
    const result = data.results?.[0]

    if (!result || !result.flagged) {
      return { text: imageUrl, flagged: false, categories: [], action: "pass" }
    }

    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, val]) => val)
      .map(([key]) => key)

    const hardBlock = ["sexual", "hate", "violence", "self-harm"]
    const isHardBlock = flaggedCategories.some((c) => hardBlock.includes(c))

    return {
      text: isHardBlock ? "[Image blocked by moderation]" : imageUrl,
      flagged: true,
      categories: flaggedCategories,
      action: isHardBlock ? "block" : "flag",
    }
  } catch (err) {
    console.error("[ImageModeration] Failed:", err)
    return { text: imageUrl, flagged: false, categories: [], action: "pass" }
  }
}
