import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  if (error) {
    const msg = encodeURIComponent(`${error}${errorDesc ? ': ' + errorDesc : ''}`)
    return NextResponse.redirect(`${origin}/login?error=callback&msg=${msg}`)
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    const msg = encodeURIComponent(exchangeError.message || 'Session 交换失败')
    return NextResponse.redirect(`${origin}/login?error=callback&msg=${msg}`)
  }

  return NextResponse.redirect(`${origin}/login?error=callback&msg=No%20code%20provided`)
}
