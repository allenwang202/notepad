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
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setErrorHint(null)
    setSuccessMsg(null)
  }

  const formatError = (err: any) => {
    const msg = err?.message || String(err || '未知错误')
    const lower = msg.toLowerCase()
    let hint: string | null = null

    if (/provider.*not.*enabled|unsupported provider/i.test(lower)) {
      hint = '👉 请去 Supabase → Authentication → Providers → 找到 GitHub，打开 Enabled 开关，填入 Client ID + Secret，点底部 Save'
    } else if (/email not confirmed|email_confirmation/i.test(lower)) {
      hint = '👉 解决办法（任选其一）：\n① 去你的邮箱点 Supabase 验证邮件里的链接\n② 或去 Supabase → Authentication → Providers → Email，关闭 "Confirm email" 开关并保存'
    } else if (/invalid login|invalid credentials|password/i.test(lower)) {
      hint = '👉 可能是：密码错了 / 邮箱还没注册 / 邮箱大小写不匹配'
    } else if (/user already registered|already exists|unique/i.test(lower)) {
      hint = '👉 这个邮箱已经注册过了，请直接用邮箱登录，不要重复注册'
    } else if (/redirect.*uri|redirect_uri|url configuration/i.test(lower)) {
      hint = '👉 请去 Supabase → Authentication → URL Configuration：\n① Site URL 填 http://localhost:3000\n② Additional Redirect URLs 增加 http://localhost:3000/auth/callback\n然后点 Save'
    }

    setError(msg)
    if (hint) setErrorHint(hint)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    resetState()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      if (!data?.session) throw new Error('登录未返回 session，请检查邮箱是否已验证')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('[登录错误]', err)
      formatError(err)
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: username.trim() ? { username: username.trim() } : undefined,
        },
      })
      if (error) throw error

      if (data?.user && !data.session) {
        setSuccessMsg('注册请求已接收！\n\n👉 如果你没收到验证邮件，可直接去 Supabase → Authentication → Providers → Email，关闭 "Confirm email" 开关并保存，然后直接登录即可。')
      } else if (data?.session) {
        router.push('/')
        router.refresh()
      } else {
        throw new Error('注册无响应，请重试')
      }
    } catch (err: any) {
      console.error('[注册错误]', err)
      formatError(err)
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
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setSuccessMsg('已发送登录链接到你的邮箱（请检查垃圾邮件）。点击邮件链接即可直接登录。\n\n如未收到邮件，请去 Supabase → Authentication → URL Configuration 把 Site URL 改为 http://localhost:3000 并保存。')
    } catch (err: any) {
      console.error('[MagicLink 错误]', err)
      formatError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    resetState()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email',
        },
      })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('未收到跳转地址')
    } catch (err: any) {
      console.error('[GitHub OAuth 错误]', err)
      formatError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.26 5.68.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5Z" />
        </svg>
        {loading ? '处理中...' : '使用 GitHub 登录（推荐）'}
      </button>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[11px] leading-relaxed text-amber-800">
        <div className="mb-1 font-semibold">📌 GitHub 登录前，必须在 Supabase 做这 3 步：</div>
        <ol className="list-decimal space-y-0.5 pl-4">
          <li>Authentication → Providers → GitHub → 开启 Enabled，填 Client ID + Secret → Save</li>
          <li>Authentication → URL Configuration → Site URL 填 <code className="rounded bg-white/70 px-1">http://localhost:3000</code></li>
          <li>Additional Redirect URLs 添加 <code className="rounded bg-white/70 px-1">http://localhost:3000/auth/callback</code> → Save</li>
        </ol>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>或使用邮箱</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
        {(['email', 'signup', 'magic'] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => { setView(v); resetState() }}
            className={`rounded-lg py-2 transition ${
              view === v ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {v === 'email' ? '邮箱登录' : v === 'signup' ? '注册账号' : '免密链接'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">❌ {error}</div>
          {errorHint && (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/70 p-2 text-xs leading-relaxed text-red-800">
              {errorHint}
            </pre>
          )}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <pre className="whitespace-pre-wrap leading-relaxed">✅ {successMsg}</pre>
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
            发送一次性登录链接到邮箱，点击直接登录，无需密码。
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
