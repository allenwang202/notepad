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

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback&msg=${encodeURIComponent('未收到 OAuth code，请重新发起登录')}`)
  }

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const msg = encodeURIComponent('环境变量 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置，请前往 Vercel → Settings → Environment Variables 添加，然后 Redeploy。')
      return NextResponse.redirect(`${origin}/login?error=callback&msg=${msg}`)
    }

    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession 失败：', exchangeError)
      const msg = encodeURIComponent(
        exchangeError.message ||
        'Session 交换失败，请检查 Supabase → URL Configuration 是否正确配置了 Callback URL。'
      )
      return NextResponse.redirect(`${origin}/login?error=callback&msg=${msg}`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  } catch (e) {
    console.error('[auth/callback] 路由异常：', e)
    const msg = encodeURIComponent(
      e instanceof Error
        ? `OAuth 回调异常：${e.message}`
        : 'OAuth 回调异常，请稍后重试或改用邮箱登录。'
    )
    return NextResponse.redirect(`${origin}/login?error=callback&msg=${msg}`)
  }
}
