# 🚀 明天你需要完成的操作清单

早安！项目代码已经全部搭好了。下面你需要花 10-15 分钟完成以下配置，整个项目就能跑起来了。

---

## 📋 总览：需要你做的 3 件事

1. ✅ **配置 Supabase 项目**（创建项目 + 执行 SQL）
2. ✅ **填写环境变量**（把 Supabase 的 Key 填到 `.env.local`）
3. ✅ **关联 GitHub 仓库并提交代码**

---

## 步骤 1：创建并配置 Supabase 项目

### 1.1 注册登录 Supabase
1. 打开 <https://supabase.com>
2. 点击 **Start your project**，使用 **GitHub 账号登录**（推荐）

### 1.2 创建新项目
1. 登录后点击 **New project**
2. 填写表单：
   - **Name**: `notepad`（或随意）
   - **Database Password**: 生成一个强密码并保存好（或者点 Generate a password）
   - **Region**: 选择 **Southeast Asia (Singapore)** 或 **Tokyo**（离中国近，延迟低）
3. 点击 **Create new project**，等待 1-2 分钟创建完成

### 1.3 执行数据库建表 SQL
1. 进入项目后，左侧菜单选择 **SQL Editor**（⚡图标）
2. 点击 **New query** 新建一个查询
3. 在本项目中打开文件：`supabase/schema.sql`，**全部复制**
4. 粘贴到 SQL Editor 的输入框中
5. 点击右下角 **Run** 按钮执行
6. 看到 **Success. No rows returned** 就 OK 了 ✅

### 1.4 获取项目 URL 和 Anon Key
1. 左侧菜单点击 **Settings**（齿轮图标）→ **API**
2. 你会看到两个值：
   - **Project URL**（类似：`https://xxxxxx.supabase.co`）
   - **anon public** Project API keys（一串很长的字符串）
3. **先不要关这个页面**，下一步要用

---

## 步骤 2：填写环境变量

### 2.1 创建 `.env.local` 文件
1. 在项目根目录，复制 `.env.local.example` 并重命名为 `.env.local`
   - 或者直接新建文件：`.env.local`
2. 把上一步获取的两个值填入：

```env
NEXT_PUBLIC_SUPABASE_URL=这里粘贴你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=这里粘贴你的 anon public key
```

⚠️ **重要**：
- URL 要完整，以 `https://` 开头
- Key 不要有多余空格
- `.env.local` 已经在 `.gitignore` 中，不会被提交

### （可选）2.2 配置 GitHub OAuth 登录
如果你希望用户能用 GitHub 一键登录（推荐），按下面配置：

#### A. 在 GitHub 创建 OAuth App
1. 打开 <https://github.com/settings/developers>
2. 左侧点击 **OAuth Apps** → **New OAuth App**
3. 填写：
   - **Application name**: `Notepad Local Dev`
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: 随便写
   - **Authorization callback URL**: 
     ```
     从 Supabase → Settings → API 里复制 URL，后面加 /auth/v1/callback
     例如：https://xxxxxx.supabase.co/auth/v1/callback
     ```
4. 点击 **Register application**
5. 创建成功后，你会看到：
   - **Client ID**: 复制保存
   - 点击 **Generate a new client secret**，生成后**立刻复制保存**（只显示一次）

#### B. 在 Supabase 中启用 GitHub 登录
1. 回到 Supabase 项目，左侧 **Authentication** → **Providers**
2. 找到 **GitHub**，点击展开，Enable 打开
3. 把刚才 GitHub 的 **Client ID** 和 **Secret** 填进去
4. 点击 **Save** 保存

> 以后部署到生产环境时，需要再创建一个新的 GitHub OAuth App，Callback URL 换成生产域名。

---

## 步骤 3：启动本地开发服务器

1. 打开终端，在项目根目录执行：

```bash
npm install
```

（如果之前 Trae 已经帮你跑过了，这一步会很快跳过）

2. 安装完成后，启动开发服务器：

```bash
npm run dev
```

3. 浏览器打开 <http://localhost:3000>，就可以看到留言板了！🎉

**测试功能清单**：
- [ ] 未登录时首页显示"请先登录"提示
- [ ] 点击登录 → 使用邮箱注册新账号 / 使用 GitHub 登录
- [ ] 登录后发布一条留言
- [ ] 留言列表显示出来，头像/昵称正确
- [ ] 编辑自己的留言
- [ ] 删除自己的留言
- [ ] 退出登录，再登录回去数据还在

---

## 步骤 4：创建 GitHub 仓库并提交代码

### 4.1 在 GitHub 上创建仓库
1. 打开 <https://github.com/new>
2. **Repository name**: `notepad`（或随意）
3. **Description**: `Next.js + Supabase 留言板练手项目`
4. 选择 **Public** 或 **Private** 都可以
5. **不要勾选** Add README / .gitignore / license（项目里已经有了）
6. 点击 **Create repository**

### 4.2 推送代码到 GitHub
创建仓库后，GitHub 会显示命令行指引。回到 Trae 项目，在终端执行：

```bash
git remote add origin https://github.com/你的用户名/notepad.git
git branch -M main
git push -u origin main
```

或者直接对我说：「我建好了 GitHub 仓库，地址是 xxxx，帮我推送代码」

---

## 📁 项目结构说明

```
notepad/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 全局布局（Header + Footer）
│   ├── page.tsx              # 首页（留言列表 + 发布表单）
│   ├── login/
│   │   └── page.tsx          # 登录页面
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      # OAuth 回调处理
│   └── globals.css           # 全局样式 + Tailwind
├── components/               # React 组件
│   ├── Header.tsx            # 顶栏（Server 组件，取用户数据）
│   ├── HeaderClient.tsx      # 顶栏交互（登出按钮等）
│   ├── MessageForm.tsx       # 发布留言表单
│   ├── MessageList.tsx       # 留言列表容器
│   ├── MessageCard.tsx       # 单条留言卡片（含编辑/删除）
│   └── LoginForm.tsx         # 登录表单：邮箱/GitHub/免密
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # 浏览器端 Supabase Client
│   │   └── server.ts         # 服务端 Supabase Client
│   └── types/
│       └── database.ts       # 数据库 TypeScript 类型定义
├── supabase/
│   └── schema.sql            # ⚠️ 你需要在 Supabase SQL Editor 执行
├── middleware.ts             # Next.js 中间件（刷新用户 Session）
├── .env.local.example        # 环境变量模板
├── SETUP.md                  # 本文件
└── package.json
```

---

## 🎯 下一步可以做的功能扩展（练手用）

完成基础流程后，可以让 Trae 帮你实现：

1. **💬 回复功能**：每条留言可以被其他人回复
2. **❤️ 点赞功能**：给留言点赞，显示点赞数
3. **📎 图片上传**：留言可以附带图片（使用 Supabase Storage）
4. **⚡ 实时订阅**：新留言自动出现，不用刷新（Supabase Realtime）
5. **👤 个人主页**：点击头像可以看到某人所有留言
6. **🔍 搜索和分页**：留言搜索、分页加载
7. **🚀 部署到 Vercel**：一键上线，全球访问

---

## ❓ 常见问题

**Q: npm install 报错？**
A: 检查 Node.js 版本 ≥ 18，执行 `node -v` 查看。版本低的话升级 Node。

**Q: 打开页面白屏 / 控制台报错 Supabase 未配置？**
A: 确认 `.env.local` 已经创建，并且两个环境变量正确。修改后需要重启 `npm run dev`。

**Q: 发布留言报错 `new row violates row-level security policy`？**
A: 说明 Schema SQL 没有正确执行。回到 Supabase SQL Editor 重新执行 `supabase/schema.sql` 全部内容。

**Q: 登录后没有自动创建 profile？**
A: 同样是 SQL 没完全执行，特别是最后那部分 `handle_new_user` trigger。

**Q: GitHub 登录失败？**
A: 检查 OAuth App 的 Callback URL 是否完全和 Supabase 的一致，不能多斜杠少斜杠。Client ID / Secret 有没有填错。

---

有任何问题直接在 Trae 里说现象，我帮你排查！
