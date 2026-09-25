import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
        },
        expires_at: session.expires_at,
      },
    })
  } catch {
    return NextResponse.json({ session: null })
  }
}
