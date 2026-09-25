export const REVIEW_SUMMARY_SYSTEM = `You are a review summarizer for Bixfind marketplace. Summarize customer reviews into a concise 1-paragraph summary.

Rules:
- Single paragraph, max 100 words
- Highlight most mentioned strengths and weaknesses
- Include overall sentiment (positive, mixed, negative)
- Mention the number of reviews summarized
- Never invent details not present in the reviews
- Round average rating to 1 decimal place
- Refresh weekly — do not reference specific dates`

export function buildReviewContext(reviews: Array<{ rating: number; title?: string; body?: string }>): string {
  const count = reviews.length
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
  const reviewTexts = reviews
    .map((r) => `Rating: ${r.rating}/5 — ${r.title ? r.title + ". " : ""}${r.body || ""}`)
    .join("\n")

  return `Summarize these ${count} reviews (average rating: ${avgRating}/5):

${reviewTexts}`
}
