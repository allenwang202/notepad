import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderClient from './HeaderClient'

export default async function Header() {
  let user = null
  let profile = null

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient()
      const { data: userRes } = await supabase.auth.getUser()
      user = userRes?.user ?? null

      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single()
          if (!error && data) profile = data
        } catch (e) {
          console.warn('[Header.tsx] 拉取 profile 异常，降级为空：', e)
        }
      }
    }
  } catch (e) {
    console.warn('[Header.tsx] supabase 异常，降级成未登录 Header：', e)
    user = null
    profile = null
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg shadow-md shadow-brand-200">
            💬
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            留言板
          </span>
        </Link>
        <HeaderClient user={user} profile={profile} />
      </div>
    </header>
  )
}
