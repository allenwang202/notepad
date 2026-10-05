'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type View = 'email' | 'signup' | 'magic'

function Bullet({ text }: { text: string }) {
  return (
    <li className="leading-relaxed pl-1">
      <span className="text-brand-700 mr-1.5">•</span>
      {text}
    </li>
  )
}

function renderBulletList(blob: string | null) {
  if (!blob) return null
  const lines = blob
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[①②③④👉🟡⚠️💡]/, '').trim())
    .filter((s) => s.length > 0)
  return (
    <ul className="mt-3 space-y-1.5 list-none pl-0 text-sm">
      {lines.map((l, i) => (
        <Bullet key={i} text={l} />
      ))}
    </ul>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [origin, setOrigin] = useState<string>('http://localhost:3000')
  const isBrowser = typeof window !== 'undefined'

  const [view, setView] = useState<View>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState<boolean>(false)

  if (isBrowser && window.location.origin !== origin) {
    setTimeout(() => setOrigin(window.location.origin), 0)
  }

  const resetState = () => {
    setError(null)
    setErrorHint(null)
    setSuccessMsg(null)
  }

  const formatError = (err: any) => {
    const msg = err?.message || String(err || '未知错误')
    const lower = msg.toLowerCase()
    const originNow = typeof window !== 'undefined' ? window.location.origin : origin

    let hint: string | null = null

    if (/provider.*not.*enabled|unsupported provider/i.test(lower)) {
      hint = `Supabase → Authentication → Providers → 找到 GitHub\n① Enabled 开关拨到 ON（蓝色）\n② 填 Client ID + Client Secret\n③ 滚到底部点 Save`
    } else if (/email not confirmed|email_confirmation/i.test(lower)) {
      hint = `解决办法（任选其一）：\n① 去你的邮箱点 Supabase 验证邮件里的链接\n② 或去 Supabase → Authentication → Providers → Email，关闭 Confirm email 开关并保存`
    } else if (/invalid login|invalid credentials|password/i.test(lower)) {
      hint = `可能的原因（按概率排序）：\n① 这个账号是「免密链接」注册的，根本没设置密码 → 请切到上方「免密链接」Tab 重发邮件登录\n② 密码输错了或大小写不对\n③ 这个邮箱还没注册过 → 切到「注册账号」Tab 创建\n④ 邮箱前后有空格或大小写不匹配（系统已自动修剪，请换小写再试）`
    } else if (/user already registered|already exists|unique/i.test(lower)) {
      hint = `这个邮箱已经注册过了，不要重复注册 → 请直接切到「邮箱登录」Tab 登录\n如果当初是用「免密链接」注册的 → 请切到「免密链接」Tab 登录`
    } else if (/redirect.*uri|redirect_uri|url configuration/i.test(lower)) {
      hint = `去 Supabase → Authentication → URL Configuration：\n① Site URL 填 ${originNow}\n② Additional Redirect URLs 点 Add，填入 ${originNow}/auth/callback\n③ 点右上角 Save（按钮很隐蔽，必须点一下）\n注意：当前浏览器地址栏端口不是 3000，就不能填 3000！要和本页面保持一致。`
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
          emailRedirectTo: `${origin}/auth/callback`,
          data: username.trim() ? { username: username.trim() } : undefined,
        },
      })
      if (error) throw error

      if (data?.user && !data.session) {
        setSuccessMsg(
          '注册请求已接收！\n如果你没收到验证邮件，可直接去 Supabase → Authentication → Providers → Email，关闭 "Confirm email" 开关并保存，然后直接登录即可。'
        )
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
        options: { emailRedirectTo: `${origin}/auth/callback` },
      })
      if (error) throw error
      setSuccessMsg(
        `已发送登录链接到你的邮箱（请检查垃圾邮件）。点击邮件链接即可直接登录。\n如未收到邮件，请去 Supabase → Authentication → URL Configuration 把 Site URL 改为 ${origin} 并保存。`
      )
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
          redirectTo: `${origin}/auth/callback`,
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
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 hover:shadow disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.26 5.68.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5Z" />
        </svg>
        {loading ? '跳转中...' : '使用 GitHub 登录'}
        <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
          推荐
        </span>
      </button>

      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-yellow-50/50 px-4 py-3 text-amber-900">
        <button
          type="button"
          onClick={() => setShowGuide((v) => !v)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-lg leading-none">💡</span>
            <div>
              <div className="text-sm font-semibold text-amber-900">
                GitHub 登录前，需要在 Supabase 完成配置吗？
              </div>
              <div className="mt-0.5 text-xs text-amber-700/80">
                {showGuide ? '点击收起指引' : `点击展开配置清单（当前运行在 ${origin}）`}
              </div>
            </div>
          </div>
          <svg
            className={`mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 transition-transform ${showGuide ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {showGuide && (
          <div className="mt-3 border-t border-amber-200/60 pt-3 space-y-3 text-xs text-amber-900/90">
            <ol className="space-y-2.5 pl-5 list-decimal marker:text-brand-600 marker:font-semibold">
              <li className="leading-relaxed">
                <span className="font-semibold">配置 GitHub Provider：</span>
                <br />
                Supabase → Authentication → Providers → GitHub → 打开 <code className="mx-1 rounded bg-white px-1.5 py-0.5 border border-amber-200 text-[11px]">Enabled</code> → 粘贴 Client ID 和 Client Secret → <b>滚到底部点 Save</b>
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold">配置 Site URL：</span>
                <br />
                Supabase → Authentication → URL Configuration → Site URL 填 <code className="mx-1 rounded bg-white px-1.5 py-0.5 border border-amber-200 text-[11px] font-mono">{origin}</code>
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold">添加回调 URL：</span>
                <br />
                上方 Additional Redirect URLs 点 Add → 填 <code className="mx-1 rounded bg-white px-1.5 py-0.5 border border-amber-200 text-[11px] font-mono">{origin}/auth/callback</code> → <b>右上角点 Save</b>
              </li>
            </ol>
            <div className="rounded-xl bg-white/80 border border-amber-200/60 px-3 py-2 leading-relaxed">
              <span className="font-semibold">做完后在本页按</span>
              <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-mono text-amber-900">Ctrl + Shift + R</code>
              <span className="font-semibold">强制刷新</span>，再点 GitHub 登录，否则浏览器会使用旧缓存。
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>或使用邮箱</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div
        role="tablist"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 text-sm font-medium shadow-inner"
      >
        {(['email', 'signup', 'magic'] as View[]).map((v) => {
          const active = view === v
          const label = v === 'email' ? '邮箱登录' : v === 'signup' ? '注册账号' : '免密链接'
          return (
            <button
              key={v}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => {
                setView(v)
                resetState()
              }}
              className={`rounded-xl py-2.5 transition ${
                active
                  ? 'bg-white text-brand-700 shadow ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-50/60 px-4 py-4 text-red-800 shadow-sm shadow-red-100">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-lg leading-none">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900">{error}</div>
              {renderBulletList(errorHint)}
            </div>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/60 px-4 py-4 text-emerald-800 shadow-sm shadow-emerald-100">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-lg leading-none">✅</span>
            <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
              {successMsg}
            </div>
          </div>
        </div>
      )}

      {view === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4 pt-1">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-300 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      )}

      {view === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4 pt-1">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              昵称 <span className="text-slate-400 font-normal">（可选）</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="显示在留言板上的名字"
              maxLength={50}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-300 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? '注册中...' : '创建账号'}
          </button>
        </form>
      )}

      {view === 'magic' && (
        <form onSubmit={handleMagicLink} className="space-y-4 pt-1">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            系统会发送一封包含一次性登录链接的邮件到你的邮箱。点击链接即可直接登录，无需设置密码。
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-300 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? '发送中...' : '发送登录链接'}
          </button>
        </form>
      )}
    </div>
  )
}
