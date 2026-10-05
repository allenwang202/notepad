'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MessageWithProfile } from '@/lib/types/database'

type Props = {
  message: MessageWithProfile
  isOwner: boolean
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return date.toLocaleDateString('zh-CN')
}

export default function MessageCard({ message, isOwner }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const username = message.profiles?.username || '匿名用户'
  const avatar = message.profiles?.avatar_url

  const handleSave = async () => {
    if (!editContent.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editContent.trim() })
        .eq('id', message.id)
      if (error) throw error
      setIsEditing(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这条留言吗？')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id)
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(err.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
    setError(null)
  }

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-600">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-800">{username}</span>
            {isOwner && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                我
              </span>
            )}
            <span className="text-xs text-slate-400">
              {formatDate(message.created_at)}
            </span>
            {message.updated_at && message.updated_at !== message.created_at && (
              <span className="text-xs text-slate-400">(已编辑)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-xl border border-brand-300 bg-brand-50/40 px-4 py-3 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={!editContent.trim() || loading}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 sm:text-base">
              {message.content}
            </p>
          )}

          {isOwner && !isEditing && (
            <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                ✏️ 编辑
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
              >
                🗑️ 删除
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
