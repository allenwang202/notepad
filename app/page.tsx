import { createClient } from '@/lib/supabase/server'
import MessageList from '@/components/MessageList'
import MessageForm from '@/components/MessageForm'
import type { MessageWithProfile } from '@/lib/types/database'

export const revalidate = 0

export default async function Home() {
  const supabase = createClient()

  const { data: messages } = await supabase
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
    .returns<MessageWithProfile[]>()

  const { data: { user } } = await supabase.auth.getUser()

  let currentProfile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    currentProfile = data
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-lg shadow-brand-200/50 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">欢迎来到留言板 ✨</h1>
        <p className="mt-2 text-sm text-brand-100 sm:text-base">
          在这里留下你的想法，和大家一起交流吧！
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-100">
          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            共 {messages?.length || 0} 条留言
          </span>
        </div>
      </section>

      <MessageForm
        user={user}
        profile={currentProfile}
      />

      <MessageList
        messages={messages || []}
        currentUserId={user?.id || null}
      />
    </div>
  )
}
