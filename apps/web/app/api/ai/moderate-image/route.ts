import { NextRequest, NextResponse } from "next/server"
import { moderateImage, checkRateLimit } from "@bixfind/ai"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const userId = request.headers.get("x-user-id") || "anonymous"
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const result = await moderateImage(imageUrl)

    return NextResponse.json({
      safe: !result.flagged,
      action: result.action,
      categories: result.categories,
      moderatedUrl: result.text,
    })
  } catch (error) {
    console.error("[Moderate Image] Error:", error)
    return NextResponse.json({ safe: true, action: "pass", categories: [], moderatedUrl: null }, { status: 200 })
  }
}
