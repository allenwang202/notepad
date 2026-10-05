'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = { username: string | null; avatar_url: string | null } | null

type Props = {
  user: { id: string; email?: string } | null
  profile: Profile
}

export default function MessageForm({ user, profile }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({ content: content.trim(), user_id: user.id })

      if (error) throw error

      setContent('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = profile?.username || user?.email?.split('@')[0] || '匿名用户'
  const avatar = profile?.avatar_url

  if (!user) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
          🔒
        </div>
        <h3 className="text-base font-semibold text-slate-800">请先登录后留言</h3>
        <p className="mt-1 text-sm text-slate-500">登录后即可发布你的第一条留言</p>
        <a
          href="/login"
          className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700"
        >
          去登录
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-sm font-medium text-slate-700">{displayName}</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写点什么吧... (最多 500 字)"
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {error && <span className="text-red-500">{error}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{content.length}/500</span>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? '发布中...' : '发布留言'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
