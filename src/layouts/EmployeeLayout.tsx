import type { ReactNode } from "react"
import { Header } from "@/components/shared/Header"
import { MessageSquarePlus, MessageSquare, Trash2 } from "lucide-react"

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  preview?: string
}

interface EmployeeLayoutProps {
  children: ReactNode
  sessions?: ChatSession[]
  activeSessionId?: string
  onSelectSession?: (id: string) => void
  onNewSession?: () => void
  onDeleteSession?: (id: string) => void
}

export function EmployeeLayout({
  children,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: EmployeeLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-surface-subtle)">
      <Header subtitle="Your confidential workplace companion" />
      <div className="flex flex-1 overflow-hidden">

        {/* Chat history sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-(--color-border) bg-white lg:flex">
          <div className="p-3">
            <button
              onClick={onNewSession}
              className="flex w-full items-center gap-2 rounded-xl border border-(--color-border) px-3 py-2 text-sm font-medium text-(--color-ink-faint) hover:border-(--color-primary)/40 hover:bg-(--color-surface-raised) hover:text-(--color-primary) transition-colors"
            >
              <MessageSquarePlus size={15} />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {sessions.length === 0 && (
              <p className="px-2 py-3 text-xs text-(--color-ink-faint)">No past sessions yet.</p>
            )}
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession?.(session.id)}
                  className={`group relative flex cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 mb-0.5 transition-colors ${
                    isActive
                      ? "bg-(--color-primary)/8 text-(--color-primary)"
                      : "hover:bg-(--color-surface-raised) text-(--color-ink)"
                  }`}
                >
                  <MessageSquare size={13} className="mt-0.5 shrink-0 opacity-60" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{session.title}</div>
                    {session.preview && (
                      <div className="truncate text-xs text-(--color-ink-faint) mt-0.5">{session.preview}</div>
                    )}
                    <div className="text-xs text-(--color-ink-faint) mt-0.5">{session.createdAt}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession?.(session.id) }}
                    className="absolute right-2 top-2.5 rounded p-0.5 text-transparent group-hover:text-(--color-ink-faint) hover:!text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
