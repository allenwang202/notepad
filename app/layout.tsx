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
        <Header />
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
