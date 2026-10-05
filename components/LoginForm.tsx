'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type View = 'email' | 'signup' | 'magic'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [view, setView] = useState<View>('email')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setSuccessMsg(null)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    resetState()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    resetState()
    setLoading(true)
    try {
      const options: { emailRedirectTo?: string; data?: { username?: string } } = {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
      if (username.trim()) {
        options.data = { username: username.trim() }
      }
      const { error, data } = await supabase.auth.signUp({ email, password, options })
      if (error) throw error
      if (data?.user && !data.session) {
        setSuccessMsg('注册成功！请查收邮箱中的验证链接进行激活。')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    resetState()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setSuccessMsg('已发送登录链接到你的邮箱，请查收！')
    } catch (err: any) {
      setError(err.message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    resetState()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'GitHub 登录失败')
    }
  }

  const Tabs = () => (
    <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => { setView('email'); resetState() }}
        className={`rounded-lg py-2 transition ${
          view === 'email' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        邮箱登录
      </button>
      <button
        type="button"
        onClick={() => { setView('signup'); resetState() }}
        className={`rounded-lg py-2 transition ${
          view === 'signup' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        注册账号
      </button>
      <button
        type="button"
        onClick={() => { setView('magic'); resetState() }}
        className={`rounded-lg py-2 transition ${
          view === 'magic' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        免密链接
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGitHubLogin}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.26 5.68.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5Z" />
        </svg>
        使用 GitHub 登录（推荐）
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>或使用邮箱</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Tabs />

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {view === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      )}

      {view === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">昵称（可选）</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="显示在留言板上的名字"
              maxLength={50}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? '注册中...' : '创建账号'}
          </button>
        </form>
      )}

      {view === 'magic' && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <p className="text-xs text-slate-400">
            我们将发送一条一次性登录链接到你的邮箱，无需记忆密码。
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送登录链接'}
          </button>
        </form>
      )}
    </div>
  )
}
