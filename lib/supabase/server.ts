import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const ENV_MISSING_WARN = (key: string) =>
  `[lib/supabase/server.ts] ⚠️ 环境变量 ${key} 未设置！` +
  ' 请前往 Vercel → Project → Settings → Environment Variables 添加 ' +
  'NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY 两个变量，然后 Redeploy。' +
  ' 本地开发时请在项目根目录创建 .env.local 并填入。'

export function createClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL) console.warn(ENV_MISSING_WARN('NEXT_PUBLIC_SUPABASE_URL'))
  if (!SUPABASE_ANON_KEY) console.warn(ENV_MISSING_WARN('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

  const cookieStore = cookies()
  return createServerClient(
    SUPABASE_URL || 'http://placeholder-supabase-url.local',
    SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
          }
        },
      },
    }
  )
}
