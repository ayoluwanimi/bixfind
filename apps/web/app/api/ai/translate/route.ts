import { NextRequest, NextResponse } from "next/server"
import { openai, DEFAULT_MODELS, TranslationSchema, TranslationRequestSchema, TRANSLATION_SYSTEM, checkRateLimit } from "@bixfind/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = TranslationRequestSchema.parse(body)
    const { text, targetLanguage, sourceLanguage } = parsed

    const userId = request.headers.get("x-user-id") || "anonymous"
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const sourceLang = sourceLanguage || "auto-detect"
    const langNames: Record<string, string> = {
      en: "English",
      pcm: "Nigerian Pidgin",
      yo: "Yoruba",
      ig: "Igbo",
      ha: "Hausa",
    }

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODELS.fast,
      messages: [
        { role: "system", content: TRANSLATION_SYSTEM },
        {
          role: "user",
          content: `Translate from ${sourceLang} to ${targetLanguage} (${langNames[targetLanguage] || targetLanguage}).
Text: "${text}"

Return JSON: { "translatedText": "...", "sourceLanguage": "en|pcm|yo|ig|ha", "sourceLanguageName": "...", "targetLanguage": "...", "confidence": 0.95 }`,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    let result

    try {
      result = TranslationSchema.parse(JSON.parse(raw))
    } catch {
      result = TranslationSchema.parse({
        translatedText: text,
        sourceLanguage: sourceLanguage || "en",
        sourceLanguageName: langNames[sourceLanguage || "en"] || "English",
        targetLanguage,
        confidence: 0.5,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Translate] Error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
