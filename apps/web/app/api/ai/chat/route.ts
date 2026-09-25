import { NextRequest, NextResponse } from "next/server"
import { openai, DEFAULT_MODELS, analyzePrompt, redactInput, moderatePublicOutput, checkRateLimit, ChatResponseSchema } from "@bixfind/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, mode = "find", history = [] } = body

    const userId = request.headers.get("x-user-id") || "anonymous"
    const sessionId = request.headers.get("x-session-id") || `sess_${Date.now()}`

    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rateLimitResult.reset },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      )
    }

    const { safe, violations } = analyzePrompt(message)
    const { redacted, wasRedacted } = redactInput(message)

    if (violations.length > 0 && !safe) {
      return NextResponse.json({
        response: "I couldn't process that request. Please rephrase and try again.",
        flags: violations,
      })
    }

    const systemPrompts: Record<string, string> = {
      find: "You are a helpful search assistant for Bixfind marketplace. Help users find services and providers in Nigeria. Suggest relevant categories and filters. Keep responses concise and helpful.",
      help: "You are a customer support assistant for Bixfind marketplace. Answer questions about how the platform works. If you don't know the answer, suggest they contact support. For payment or dispute issues, recommend human handoff.",
      build: "You are a website builder assistant for Bixfind mini-websites. Help providers improve their profiles with better copy, color suggestions, and layout tips. Output structured suggestions.",
    }

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODELS.fast,
      messages: [
        { role: "system", content: systemPrompts[mode] || systemPrompts.find },
        ...history.slice(-10).map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: redacted },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    let responseText = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."

    const moderation = moderatePublicOutput(responseText)

    const chatResponse = ChatResponseSchema.parse({
      message: {
        id: `resp_${Date.now()}`,
        role: "assistant",
        content: moderation.text,
        timestamp: new Date().toISOString(),
      },
      suggestions: mode === "find"
        ? ["Try 'plumber in Lagos'", "Show top-rated providers", "Browse all categories"]
        : mode === "help"
        ? ["How do bookings work?", "What is the refund policy?"]
        : ["Make hero punchier", "Suggest color palette"],
    })

    return NextResponse.json(chatResponse, {
      headers: {
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      },
    })
  } catch (error) {
    console.error("[AI Chat] Error:", error)
    return NextResponse.json({ error: "AI service failed" }, { status: 500 })
  }
}
