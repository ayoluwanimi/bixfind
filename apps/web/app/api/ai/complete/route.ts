import { NextRequest, NextResponse } from "next/server"
import { openai, DEFAULT_MODELS, checkRateLimit, moderatePublicOutput, analyzePrompt, CompletionResponseSchema } from "@bixfind/ai"

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt, maxTokens = 500, temperature = 0.7, model } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const userId = request.headers.get("x-user-id") || "anonymous"
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 },
      )
    }

    const { safe, stripped } = analyzePrompt(prompt)
    const safePrompt = safe ? prompt : stripped

    const completion = await openai.chat.completions.create({
      model: model || DEFAULT_MODELS.fast,
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user", content: safePrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    })

    let text = completion.choices[0]?.message?.content || ""

    const moderation = moderatePublicOutput(text)
    if (moderation.action === "block") {
      text = moderation.text
    }

    const response = CompletionResponseSchema.parse({
      text,
      finishReason: completion.choices[0]?.finish_reason || "stop",
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[AI Complete] Error:", error)
    return NextResponse.json({ error: "Completion failed" }, { status: 500 })
  }
}
