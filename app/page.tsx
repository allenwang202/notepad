import { createClient } from '@/lib/supabase/server'
import MessageList from '@/components/MessageList'
import MessageForm from '@/components/MessageForm'
import type { MessageWithProfile } from '@/lib/types/database'
import Link from 'next/link'

export const revalidate = 0

export default async function Home() {
  let messages: MessageWithProfile[] = []
  let user = null
  let currentProfile = null
  let errorBanner: { title: string; tips: string[] } | null = null

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      errorBanner = {
        title: '⚠️ 未检测到 Supabase 环境变量，当前无法加载留言',
        tips: [
          'Vercel 部署：前往 Vercel → Project → Settings → Environment Variables，添加 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY，然后 Redeploy。',
          '本地开发：在项目根目录创建 .env.local 文件，填入上述 2 个变量（可参考 .env.local.example），然后重启 npm run dev。',
        ],
      }
    } else {
      const supabase = createClient()

      const [messagesRes, userRes] = await Promise.all([
        supabase
          .from('messages')
          .select(`
            id,
            user_id,
            content,
            created_at,
            updated_at,
            profiles ( username, avatar_url )
          `)
          .order('created_at', { ascending: false })
          .returns<MessageWithProfile[]>(),
        supabase.auth.getUser(),
      ])

      if (messagesRes.error) {
        console.error('[page.tsx] 拉取 messages 失败：', messagesRes.error)
        const m = messagesRes.error.message || ''
        if (/does not exist/i.test(m)) {
          errorBanner = {
            title: '⚠️ 数据库还没有建表',
            tips: [
              '前往 Supabase → SQL Editor → New Query，把项目里 supabase/schema.sql 的内容完整粘贴进去，点 Run 执行。',
              '执行完后回到页面 Ctrl+Shift+R 强制刷新即可。',
            ],
          }
        } else if (/row level|policy/i.test(m)) {
          errorBanner = {
            title: '⚠️ messages 表缺少 RLS select 策略',
            tips: [
              '重新在 Supabase SQL Editor 执行 schema.sql 里 create policy "Messages are viewable by everyone." 那一段。',
            ],
          }
        }
      } else {
        messages = messagesRes.data || []
      }

      user = userRes?.data?.user ?? null

      if (user) {
        try {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single()
          if (!profileErr && profileData) currentProfile = profileData
        } catch (e) {
          console.warn('[page.tsx] 拉取当前 profile 失败，降级为空：', e)
        }
      }
    }
  } catch (err) {
    console.error('[page.tsx] 渲染阶段异常（已降级渲染）：', err)
    errorBanner = {
      title: '⚠️ 加载留言失败，稍后再试',
      tips: [
        '查看服务器日志可获得详情。',
        '如果是 Vercel 部署，可前往 Vercel → Deployment → Logs 查看。',
      ],
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-lg shadow-brand-200/50 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">欢迎来到留言板 ✨</h1>
        <p className="mt-2 text-sm text-brand-100 sm:text-base">
          在这里留下你的想法，和大家一起交流吧！
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-100">
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            共 {messages.length} 条留言
          </span>
        </div>
      </section>

      {errorBanner && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-sm">
          <p className="text-base font-bold text-amber-800">{errorBanner.title}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-700">
            {errorBanner.tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      <MessageForm
        user={user}
        profile={currentProfile}
      />

      <MessageList
        messages={messages}
        currentUserId={user?.id || null}
      />
    </div>
  )
}
