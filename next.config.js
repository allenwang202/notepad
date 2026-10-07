// ============================================================
// 🟢 next.config.js
// ============================================================
// 说明：
// 1. 这个模块在 **Vercel Build 阶段会立即执行**（不是 Runtime，就是 Build 期间）
//    所以在这里打印的环境变量会 100% 出现在 Vercel Build 日志里。
// 2. 我们用它来「硬核验证」Supabase 两个 Env 到底有没有被 Vercel 注入。
// 3. 如果检测到空值 + Vercel 环境，直接 process.exit(2) 让构建失败
//    避免带着空 Supabase 配置上线（之前会出现「未检测到环境变量」黄卡）
// ============================================================

const KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

function now() { return new Date().toISOString() }
function pad(s, n) { s = String(s); while (s.length < n) s = s + ' '; return s }

function inspect(k) {
  const v = process.env[k] ?? ''
  const len = v.length
  const first10 = v.slice(0, 10)
  let masked = '(空字符串)'
  if (len > 0) masked = len <= 10 ? v.replace(/./g, 'X') : `${v.slice(0, 6)}***${v.slice(-4)}`
  return { k, len, first10, masked, empty: len === 0 }
}

// ============== 下面这段在「任何时候 next.config.js 被加载」都会执行 ==============
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV)
console.log()
console.log('═'.repeat(78))
console.log(`  ╔══════════════════════════════════════════════════════════════════════╗`)
console.log(`  ║  🟢 [ENV-DIAG] Supabase 环境变量诊断（next.config.js 加载时执行）        ║`)
console.log(`  ╚══════════════════════════════════════════════════════════════════════╝`)
console.log(`  🕐 时间:      ${now()}`)
console.log(`  🛠️  NODE_ENV:  ${process.env.NODE_ENV ?? 'unknown'}`)
console.log(`  ☁️  运行位置:   ${IS_VERCEL ? `Vercel 环境 (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unknown'})` : '本地环境（本地 npm run build / dev）'}`)
console.log()
console.log('  ── 检查 Supabase 相关环境变量（构建期 process.env 里读到的值）──')
const report = KEYS.map(inspect)
const anyEmpty = report.some(r => r.empty)
for (const r of report) {
  const icon = r.empty ? '❌ [缺失 / 空字符串]' : '✅ [已注入]'
  console.log(`  ${icon} ${pad(r.k, 42)}`)
  console.log(`       ├─ 长度(字符):  ${pad(r.len, 6)}`)
  console.log(`       ├─ 前10字符:    ${r.empty ? '(空)' : JSON.stringify(r.first10)}`)
  console.log(`       └─ 脱敏显示:    ${r.masked}`)
  console.log()
}

if (anyEmpty) {
  console.log('  ⚠️⚠️⚠️  检测到至少一个 Supabase 环境变量为空字符串或未设置！')
  console.log('  👉 Vercel 用户（当前就是）修复步骤：')
  console.log('     1. 项目 → Settings → Environment Variables → Project 标签页')
  console.log('     2. 确认 2 个 Key 名称一字不差：')
  console.log('        ➡️ NEXT_PUBLIC_SUPABASE_URL     （不是 KEYS，也不是别的拼写）')
  console.log('        ➡️ NEXT_PUBLIC_SUPABASE_ANON_KEY（不是 SUPABASE_ANON_PUBLIC_KEY 等）')
  console.log('     3. 点击每行右边的铅笔按钮「Edit」，确认 Value 没粘贴错 / 多空格')
  console.log('     4. Environment 复选框里 Production 必须勾（Preview / Development 随意）')
  console.log('     5. 回到顶部 Deployments → 最新一条部署的 ⋯ → Redeploy')
  console.log('        → 弹窗里一定要「取消勾选 Use existing Build Cache」')
  console.log('  👉 本地开发：项目根目录 .env.local 里补两行（参考 .env.local.example）')
} else {
  console.log('  ✅ 两个 Supabase 环境变量均已在构建期成功注入。')
  console.log('     如果线上页面仍显示「未检测到环境变量」黄卡：')
  console.log('     → 那是 Runtime Server Component 代码判定有误，去 Runtime 日志搜 [page.tsx]')
}
console.log('═'.repeat(78))
console.log()

if (IS_VERCEL && anyEmpty) {
  console.error('  🔴 为了避免带着空 Supabase 配置上线，本构建被主动中止（exit 2）。')
  console.error('     请按上述步骤修复环境变量后重新部署。')
  process.exit(2)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig
