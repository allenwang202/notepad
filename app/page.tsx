import { createClient } from '@/lib/supabase/server'
import MessageList from '@/components/MessageList'
import MessageForm from '@/components/MessageForm'
import type { MessageWithProfile } from '@/lib/types/database'
import Link from 'next/link'

export const revalidate = 0

type EnvDiagItem = { name: string; raw: string; ok: boolean; len: number; first10: string; masked: string }

function diagEnv(name: string): EnvDiagItem {
  const raw = process.env[name] ?? ''
  const len = raw.length
  const ok = len > 0
  const first10 = raw.slice(0, 10)
  let masked = '(空字符串)'
  if (len > 0) masked = len <= 10 ? raw.replace(/./g, 'X') : `${raw.slice(0, 6)}***${raw.slice(-4)}`
  return { name, raw, ok, len, first10, masked }
}

export default async function Home() {
  let messages: MessageWithProfile[] = []
  let user = null
  let currentProfile = null
  let errorBanner: { title: string; tips: string[]; diagBox?: { label: string; items: EnvDiagItem[] } } | null = null

  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const envDiag = [diagEnv('NEXT_PUBLIC_SUPABASE_URL'), diagEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')]
    console.warn('[page.tsx ENV-DIAG] Server Component 读到环境变量：', envDiag.map(e => `${e.name}=${e.ok ? '✅OK:'+e.masked : '❌空/缺失'} (len=${e.len})`).join(' | '))

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      errorBanner = {
        title: '⚠️ 未检测到 Supabase 环境变量，当前无法加载留言',
        tips: [
          '【开发者排错用】下方"🔍 服务端诊断面板"里直接显示了页面实际读到的值，复制给我即可定位。',
          'Vercel 部署：前往 Vercel → Project → Settings → Environment Variables，确认 2 个 Key 名称拼写完全正确（注意是单数 _KEY，不是 _KEYS！）。',
          'Vercel 部署：Edit 每个 Key，确认 Value 不是空、末尾没多空格、Environment 勾选包含 Production，然后 Redeploy（取消勾选 Use existing Build Cache）。',
          '本地开发：在项目根目录创建 .env.local 文件，填入上述 2 个变量（可参考 .env.local.example），然后重启 npm run dev。',
        ],
        diagBox: { label: '🔍 服务端诊断面板（复制下方内容）', items: envDiag },
      }
    } else {
      const supabase = createClient()

      const [messagesRes, userRes] = await Promise.all([
        // 🟢 第一次查询：只查 messages，不嵌套 profiles，不依赖外键
        supabase
          .from('messages')
          .select(`id, user_id, content, created_at, updated_at`)
          .order('created_at', { ascending: false })
          .limit(200),
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
        const rawMessages = (messagesRes.data as any[]) || []
        if (rawMessages.length === 0) {
          messages = []
        } else {
          // 🟢 收集所有 user_id 去重，第二次查询 profiles
          const userIds = Array.from(new Set(rawMessages.map(m => m.user_id)))
          const { data: profiles, error: pfErr } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

          if (pfErr) {
            console.warn('[page.tsx] 拉取 profiles 失败，降级为空：', pfErr)
          }
          const pfMap = new Map<string, { username: string | null; avatar_url: string | null }>()
          if (!pfErr && profiles) {
            for (const p of profiles) pfMap.set(p.id, { username: p.username, avatar_url: p.avatar_url })
          }

          // 🟢 在 JS 里手动拼 profiles 到对应 message
          messages = rawMessages.map(m => ({
            id: m.id,
            user_id: m.user_id,
            content: m.content,
            created_at: m.created_at,
            updated_at: m.updated_at,
            profiles: pfMap.get(m.user_id) ?? { username: null, avatar_url: null },
          })) as MessageWithProfile[]
        }
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
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-sm">
            <p className="text-base font-bold text-amber-800">{errorBanner.title}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-700">
              {errorBanner.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          {errorBanner.diagBox && (
            <div className="rounded-2xl border border-slate-300 bg-slate-900 p-4 text-[13px] font-mono leading-relaxed text-slate-100 shadow-inner">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                {errorBanner.diagBox.label} → 把下面 4 行完整复制给 Trae
              </p>
              <pre className="whitespace-pre-wrap break-all">
{errorBanner.diagBox.items.map(item =>
  `🔎 ${item.name}\n   ├─ 空值 / 缺失:   ${item.ok ? '否 ✅' : '是 ❌'}\n   ├─ 长度(字符):   ${item.len}\n   ├─ 前 10 字符:  ${JSON.stringify(item.first10)}\n   └─ 脱敏显示:     ${item.masked}\n`
).join('\n')}
              </pre>
            </div>
          )}
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
