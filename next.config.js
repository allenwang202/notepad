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

const KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'DEBUG_VERCEL_TEST']

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

// 特殊的「DEBUG_VERCEL_TEST」是用户手动加的探针，用来验证：
// 只要 Vercel Env Variables 能正常注入，这个值就会出现在 Build Log 里
// 因此用它可以判断「是注入链路坏了，还是只是 Supabase Key 本身为空」
const DEBUG_PROBE = process.env.DEBUG_VERCEL_TEST ?? ''
if (DEBUG_PROBE) {
  console.log('  ⭐ [DEBUG PROBE] 检测到 DEBUG_VERCEL_TEST 非空：', JSON.stringify(DEBUG_PROBE))
  console.log('     → 结论：✅ Vercel Settings → Environment Variables 的注入链路完全正常！')
  console.log('        如果 NEXT_PUBLIC_SUPABASE_* 仍然为空，那只是那 2 个 Key 本身没有 Edit 对 / Value 空，不是 Vercel 的 bug。')
} else {
  console.log('  🛈 [DEBUG PROBE] 未检测到 DEBUG_VERCEL_TEST。')
  console.log('     你可以去 Settings → Environment Variables 手动加一个同名 Key，Value 随便写 (如 hello-123)，然后 Redeploy 一次：')
  console.log('     → 如果 Build Log 出现上面的 ⭐⭐⭐，说明「Vercel Env 注入没问题，只是那 2 个 Supabase Key 没填对」')
  console.log('     → 如果 Build Log 连 ⭐⭐⭐ 都没有，说明「这个部署跑的是老代码，不带 ENV-DIAG 功能 → 先把代码推到 GitHub 上来」')
}
console.log()

// 去掉 DEBUG_VERCEL_TEST 后，再判断 Supabase 2 个 Key 是否空
const SUPABASE_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const supabaseReport = report.filter(r => SUPABASE_KEYS.includes(r.k))
const supabaseEmpty = supabaseReport.some(r => r.empty)

if (supabaseEmpty) {
  console.log('  ⚠️⚠️⚠️  Supabase 2 个核心 Key 至少一个为空或未设置！')
  console.log('  👉 Vercel 用户修复步骤（必须按顺序）：')
  console.log('     1. 项目 → Settings → Environment Variables → Project 标签页')
  console.log('     2. 确认 2 个 Key 名称一字不差（大小写和下划线都要对）：')
  console.log('        ➡️ NEXT_PUBLIC_SUPABASE_URL      （不要写成 _SUPABASE_URLS 或别的）')
  console.log('        ➡️ NEXT_PUBLIC_SUPABASE_ANON_KEY （不要写成 _KEYS 复数！！！这个是 90% 的人会犯的拼写错误）')
  console.log('     3. 每行右边点「铅笔图标 → Edit」，打开后确认：')
  console.log('        a) Value 框里真的有内容（不是空字符串）')
  console.log('        b) 末尾没有多余空格 / 回车 / 中文标点（强烈建议复制后粘贴到记事本看一眼）')
  console.log('        c) Environment 复选框里 Production 必须是勾选状态（只勾了 Preview 会导致线上 Production 看不到）')
  console.log('     4. 每改完一个 Key 都记得点 Save')
  console.log('     5. 去 Deployments → 最新一条部署的 ⋯ → Redeploy → 弹窗「取消勾选 Use existing Build Cache」→ Confirm')
  console.log('  👉 本地开发：项目根目录 .env.local 里补 2 行（参考 .env.local.example），然后重启 npm run dev')
} else {
  console.log('  ✅ NEXT_PUBLIC_SUPABASE_URL + ANON_KEY 两个 Key 均已在构建期成功注入 ✅')
  console.log('     如果线上页面仍显示「未检测到环境变量」黄卡，说明：')
  console.log('     → 是 Runtime Server Component 侧的问题，去 Vercel Deployment Logs 搜：')
  console.log('       🔎 [page.tsx ENV-DIAG]    和    🔎 [lib/supabase ENV-DIAG]')
  console.log('     把 Runtime 日志里这两行的输出截图给 Trae 即可定位。')
}
console.log('═'.repeat(78))
console.log()

if (IS_VERCEL && supabaseEmpty && !DEBUG_PROBE) {
  console.error('  🔴 为了避免带着空 Supabase 配置上线，本构建被主动中止（exit 2）。')
  console.error('     请按上述步骤 Edit 对应的 Key，然后 Redeploy（取消 Cache）。')
  console.error('     先加 DEBUG_VERCEL_TEST 探针（任意值）再 Redeploy，能最快判断是不是注入链路问题。')
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
