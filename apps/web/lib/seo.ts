/**
 * Shared SEO helpers for provider websites and search-engine discovery.
 *
 * Every published provider site must be findable on Google with its
 * association to Bixfind visible (title suffix, og:site_name, canonical URL,
 * JSON-LD `isPartOf`). These helpers keep that consistent in one place.
 */

export const DEFAULT_BASE_URL = 'https://bixfind.indevs.in'

/** The platform's canonical base URL (public site, same one robots/sitemap use). */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL
}

/**
 * Stable IndexNow key. Held in code (not env) so the key-file route and the
 * ping always agree; it is not a secret — IndexNow requires it to be publicly
 * verifiable by fetching `${base}/indexnow-key.txt`.
 */
export const INDEXNOW_KEY = 'bixfind7f3a9c2e4d6b8f1a0c5e3d7b9f2a4c6'

export const INDEXNOW_KEY_LOCATION = `${getBaseUrl()}/indexnow-key.txt`

/**
 * Notify search engines that a public URL changed:
 *  - revalidate the platform sitemap so newly published pages appear on the
 *    next crawl immediately,
 *  - submit the URL to IndexNow (Bing/Yandex/Seznam et al.),
 *  - attempt the legacy Google sitemap ping (best-effort; harmless when
 *    unsupported — Google's primary discovery path is the sitemap itself).
 *
 * NEVER throws: an engine being unreachable must not fail a publish.
 */
export async function noticeSearchEngines(path: string): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/sitemap.xml')
  } catch {
    // revalidatePath availability can differ by runtime — ignore
  }

  const base = getBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  const submit = async (endpoint: string) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      await fetch(endpoint, { signal: controller.signal, cache: 'no-store' })
      clearTimeout(timer)
    } catch {
      // best-effort only
    }
  }

  await Promise.allSettled([
    submit(`https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}&keyLocation=${encodeURIComponent(INDEXNOW_KEY_LOCATION)}`),
    submit(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${base}/sitemap.xml`)}`),
  ])
}
