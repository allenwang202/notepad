import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (typeof window !== 'undefined' && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
    console.warn('[lib/supabase/client.ts] ⚠️ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置，浏览器端 Supabase 功能暂不可用。')
  }

  return createBrowserClient(
    SUPABASE_URL || 'http://placeholder-supabase-url.local',
    SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
