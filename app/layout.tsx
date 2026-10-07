import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: '留言板 · Notepad',
  description: '基于 Next.js + Supabase 的练手留言板项目',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* 双保险：Header 已经 try-catch，这里再包一层，确保任何 Header 子树异常都不会把整页带崩 */}
        <HeaderFallback />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="py-8 text-center text-sm text-slate-400">
          Built with Next.js + Supabase · Trae 练手项目
        </footer>
      </body>
    </html>
  )
}

import { Suspense } from 'react'

function HeaderFallback() {
  return (
    <Suspense fallback={<HeaderPlaceholder />}>
      <Header />
    </Suspense>
  )
}

function HeaderPlaceholder() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <span className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg shadow-md shadow-brand-200 opacity-60">
            💬
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-500">留言板</span>
        </span>
      </div>
    </header>
  )
}
