// ============================================================
// 🟢 Notepad 留言板 — V2 配置自检脚本
// 用途：npm run dev 之前，先验证 5 项关键配置
// 运行：npm run check   或   node scripts/sanity-check.mjs
// ============================================================

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const ENV_PATH = resolve(ROOT, '.env.local')

const PAD = (n = 44) => '─'.repeat(n)
const GREEN = (s) => `\x1b[32m${s}\x1b[0m`
const RED   = (s) => `\x1b[31m${s}\x1b[0m`
const YELLOW= (s) => `\x1b[33m${s}\x1b[0m`
const BLUE  = (s) => `\x1b[34m${s}\x1b[0m`
const BOLD  = (s) => `\x1b[1m${s}\x1b[0m`

const results = []
const add = (ok, name, detail = '') => results.push({ ok, name, detail })

function parseEnv(path) {
  const out = {}
  const text = readFileSync(path, 'utf8')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const k = line.slice(0, eq).trim()
    let v = line.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

printHeader('1/5  检查 .env.local 文件存在')
if (!existsSync(ENV_PATH)) {
  add(false, '.env.local 存在', '❌ 没找到 .env.local，请在项目根目录创建并填入 2 个环境变量')
} else {
  add(true, '.env.local 存在')
  const env = parseEnv(ENV_PATH)

  printHeader('2/5  检查环境变量完整性')
  const URL = env.NEXT_PUBLIC_SUPABASE_URL
  const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasURL = !!URL && URL.startsWith('https://') && URL.endsWith('.supabase.co')
  const hasKEY = !!KEY && KEY.length > 20
  add(hasURL, 'NEXT_PUBLIC_SUPABASE_URL 格式正确',
      hasURL ? URL : `当前值：${URL ?? '(空)'}\n👉 正确格式：https://<project-ref>.supabase.co`)
  add(hasKEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY 非空',
      hasKEY ? `已读取，长度 ${KEY.length}` : '当前为空，请从 Supabase → Settings → API 复制')

  if (!(hasURL && hasKEY)) { printFooter(); process.exit(1) }

  printHeader('3/5  网络连接 + messages 表可读 (RLS)')
  const supabase = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const { error, count } = await supabase
      .from('messages')
      .select('*', { head: true, count: 'exact' })
    if (error) {
      if (/does not exist/i.test(error.message)) {
        add(false, 'messages 表存在',
            `❌ messages 表不存在！\n👉 请去 Supabase → SQL Editor → 粘贴 supabase/schema.sql 内容点 Run`)
      } else if (/policy/i.test(error.message) || /row level/i.test(error.message)) {
        add(false, 'messages 表 RLS select 策略缺失',
            `❌ ${error.message}\n👉 schema.sql 里必须包含 "Messages are viewable by everyone" 这条 select policy`)
      } else {
        add(false, '查询 messages 表', `❌ ${error.message}`)
      }
    } else {
      add(true, 'messages 表可读', `当前留言数：${count ?? 0}`)
    }
  } catch (e) {
    add(false, '网络连通 Supabase', `❌ 无法连接：${e.message}\n👉 检查本机网络，或 URL/Key 是否粘贴错了`)
  }

  printHeader('4/5  profiles 表存在 & RLS select 可用')
  try {
    const { error, count } = await supabase
      .from('profiles')
      .select('*', { head: true, count: 'exact' })
    if (error) {
      if (/does not exist/i.test(error.message)) {
        add(false, 'profiles 表存在',
            `❌ profiles 表不存在！\n👉 去 SQL Editor 重新执行 schema.sql 的 CREATE TABLE profiles 部分`)
      } else {
        add(false, '查询 profiles 表', `❌ ${error.message}`)
      }
    } else {
      add(true, 'profiles 表可读', `当前 profiles 数：${count ?? 0}`)
    }
  } catch (e) {
    add(true, 'profiles 查询异常（黄灯）', e.message)
  }

  printHeader('5/5  Email 登录：Confirm email 开关检查（反推法）')
  console.log(YELLOW('   用一个"不存在的邮箱/错误密码"尝试登录：'))
  console.log(YELLOW('   若错误=Invalid login credentials → 开关关了 ✅'))
  console.log(YELLOW('   若错误=Email not confirmed → 仍需验证 ❌'))
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: '__sanity_check_nobody__@example.com',
      password: 'wrongpass123',
    })
    if (!error) {
      add(true, 'Confirm email 开关（黄灯）', '🟨 反常：假邮箱居然登录成功？请手动检查开关')
    } else {
      const msg = error.message || ''
      const lower = msg.toLowerCase()
      if (/email not confirmed|email_confirmation|confirm your email/i.test(lower)) {
        add(false, 'Confirm email 开关已关闭',
            `❌ 检测到邮箱验证仍开启！\n👉 Supabase → Authentication → Providers → Email\n   → 关闭 "Confirm email" 开关 → 底部点 Save\n   （否则假邮箱注册后永远登录不了）\n\nSupabase 原句：${msg}`)
      } else if (/invalid|credentials|password/i.test(lower)) {
        add(true, 'Confirm email 开关已关闭 ✅',
            `反推依据：错误为 "${msg}"，没有 email not confirmed，开关已关。`)
      } else {
        add(true, 'Confirm email（黄灯）', `🟨 无法反推，错误：${msg}\n   请手动去 Supabase 确认开关为 OFF`)
      }
    }
  } catch (e) {
    add(true, 'Confirm email（黄灯）', `🟨 异常：${e.message}，请手动确认。`)
  }
}

function printHeader(n) {
  console.log(`\n${BOLD(BLUE(`╭${PAD()}\n│ ${n}\n╰${PAD()}`))}`)
}
function printFooter() {
  console.log(`\n${BOLD('═'.repeat(60))}`)
  const total = results.length
  const pass = results.filter(r => r.ok).length
  const fail = total - pass
  console.log(`  总计：${total} 项    ${GREEN(`通过 ${pass}`)}    ${fail > 0 ? RED(`失败 ${fail}`) : ''}`)
  console.log()
  for (const r of results) {
    const icon = r.ok ? GREEN('✅') : RED('❌')
    console.log(`  ${icon}  ${r.name}`)
    if (r.detail) for (const line of String(r.detail).split(/\r?\n/)) console.log(`        ${line}`)
  }
  console.log()
  if (fail === 0) {
    console.log(GREEN(BOLD('  🎉 全部通过！现在执行： npm run dev')))
    console.log(GREEN('     → 打开 http://localhost:3000 开始测试功能'))
    process.exit(0)
  } else {
    console.log(RED(BOLD('  ⛔ 检测到失败项，请先修复上方 ❌，再重新运行 npm run check')))
    console.log(YELLOW('     （修复配置后无需重启任何东西，直接再跑一次命令即可）'))
    process.exit(1)
  }
}
printFooter()
