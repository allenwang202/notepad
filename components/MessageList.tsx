import MessageCard from './MessageCard'
import type { MessageWithProfile } from '@/lib/types/database'

type Props = {
  messages: MessageWithProfile[]
  currentUserId: string | null
}

export default function MessageList({ messages, currentUserId }: Props) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          📭
        </div>
        <h3 className="text-lg font-semibold text-slate-800">还没有留言</h3>
        <p className="mt-2 text-sm text-slate-500">
          成为第一个发布留言的人吧！
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          isOwner={currentUserId === message.user_id}
        />
      ))}
    </div>
  )
}
