import { INDEXNOW_KEY } from '@/lib/seo'

/**
 * IndexNow key file. Bing/Yandex/Seznam verify submission ownership by
 * fetching this file and comparing its content to the submitted key.
 */
export async function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
