import Link from 'next/link'
import LoginForm from '@/components/LoginForm'

export default function LoginPage({ searchParams }: { searchParams: { error?: string; msg?: string } }) {
  const showCallbackError = searchParams.error === 'callback' && searchParams.msg

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-lg shadow-brand-200">
              💬
            </div>
            <h1 className="text-2xl font-bold text-slate-800">欢迎回来</h1>
            <p className="mt-1 text-sm text-slate-500">登录后即可发布留言</p>
          </div>

          {showCallbackError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">❌ 认证回调失败：</div>
              <div className="mt-1 break-all text-xs">{decodeURIComponent(searchParams.msg!)}</div>
              <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs leading-relaxed text-red-800">
                👉 请检查：
                <ul className="mt-1 list-disc pl-4">
                  <li>Supabase → URL Configuration → Site URL 是 <code>http://localhost:3000</code></li>
                  <li>Additional Redirect URLs 含 <code>http://localhost:3000/auth/callback</code></li>
                  <li>GitHub OAuth App 的 Callback URL 正确且无多余斜杠</li>
                </ul>
              </div>
            </div>
          )}

          <LoginForm />

          <div className="mt-8 text-center text-sm text-slate-400">
            <Link href="/" className="transition hover:text-slate-600">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
