import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function middleware(request: NextRequest) {
  // ✅ 防御 1：环境变量没配（Vercel Env 没加）时，直接放行不崩溃
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[middleware] ⚠️ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 未配置，跳过 Supabase session 刷新。'
        + ' 请前往 Vercel → Project → Settings → Environment Variables 添加这 2 个变量后 Redeploy。'
    )
    return NextResponse.next()
  }

  // ✅ 创建一个可变的 response（Vercel 官方推荐写法：先 clone 再 mutate，兼容性最好）
  let response: NextResponse = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          } catch (e) {
            console.error(`[middleware] cookies.set(${name}) 异常：`, e)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({ name, value: '', ...options })
            response.cookies.set({ name, value: '', ...options })
          } catch (e) {
            console.error(`[middleware] cookies.remove(${name}) 异常：`, e)
          }
        },
      },
    })

    // ✅ 防御 2：getUser() 内部任何异常（Token 过期、篡改、Supabase 超时）都不影响页面加载
    await supabase.auth.getUser()
  } catch (err) {
    console.error('[middleware] supabase.auth.getUser() 异常（已忽略，继续放行请求）：', err)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
  // ✅ 防御 3：强制 Node.js runtime，避免 Edge Runtime 下 crypto/Web API 兼容问题
  runtime: 'nodejs',
  unstable_allowDynamic: [
    '**/node_modules/@supabase/**',
    '**/node_modules/@supabase/ssr/**',
  ],
}
