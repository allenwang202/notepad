'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  user: { id: string; email?: string } | null
  profile: { username: string | null; avatar_url: string | null } | null
}

export default function HeaderClient({ user, profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700"
      >
        登录
      </a>
    )
  }

  const displayName = profile?.username || user.email?.split('@')[0] || '匿名用户'
  const avatar = profile?.avatar_url

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-slate-700">{displayName}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
      >
        退出
      </button>
    </div>
  )
}
