import { useState, useEffect, useRef } from "react"
import { EmployeeLayout, type ChatSession } from "@/layouts/EmployeeLayout"
import { ChatWindow } from "@/components/employee/ChatWindow"
import { ChatInput } from "@/components/employee/ChatInput"
import { ConfidentialityNotice } from "@/components/employee/ConfidentialityNotice"
import { CameraToggle } from "@/components/employee/CameraToggle"
import { sendMessageToGrok, type Message } from "@/lib/grok"
import { useFer } from "@/lib/FerContext"
import type { ChatMessage } from "@/lib/types"

const getSessionsKey = () => {
  const user = localStorage.getItem("devguard_employee_user") || "guest"
  return `devguard_sessions_${user}`
}
const SESSIONS_KEY = getSessionsKey()

interface StoredSession {
  id: string
  title: string
  createdAt: string
  preview?: string
  messages: ChatMessage[]
}

function loadSessions(): StoredSession[] {
  try {
    const key = getSessionsKey()
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveSessions(sessions: StoredSession[]) {
  localStorage.setItem(getSessionsKey(), JSON.stringify(sessions))
}

function newSession(): StoredSession {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    createdAt: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    messages: [],
  }
}

function getCheckinQuestion(sentiment: string | null): string {
  if (!sentiment) return "Hey! How are you feeling as you start your day today?"
  if (sentiment === "negative") return "You seemed a bit stressed last time. How are you feeling today?"
  if (sentiment === "positive") return "Great energy last session! What's keeping you motivated today?"
  return "Welcome back! How are things going for you today?"
}

function getQuickReplies(sentiment: string | null): string[] {
  if (sentiment === "negative") return ["I'm doing much better!", "Still a bit stressed", "Pretty good actually"]
  if (sentiment === "positive") return ["Still going strong!", "A bit tired today", "Could be better"]
  return ["Feeling great!", "It's okay", "Could be better"]
}

export function EmployeePage() {
  const freshSessionRef = useRef<StoredSession | null>(null)
  if (!freshSessionRef.current) {
    freshSessionRef.current = newSession()
  }

  const [sessions, setSessions] = useState<StoredSession[]>(() => {
    const stored = loadSessions()
    return [freshSessionRef.current!, ...stored]
  })
  const [activeId, setActiveId] = useState<string>(() => freshSessionRef.current!.id)
  const [isSending, setIsSending] = useState(false)
  const [checkinDismissed, setCheckinDismissed] = useState(() =>
    localStorage.getItem("devguard_checkin_dismissed") === new Date().toDateString()
  )
  const { setChatAnalysis, chatAnalysis } = useFer()

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0]
  const messages = activeSession?.messages ?? []

  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  function updateSession(id: string, updates: Partial<StoredSession>) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s))
  }

  function handleNewSession() {
    const s = newSession()
    setSessions((prev) => [s, ...prev])
    setActiveId(s.id)
    setCheckinDismissed(false)
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === 0) {
        const s = newSession()
        setActiveId(s.id)
        return [s]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  const dismissCheckin = () => {
    localStorage.setItem("devguard_checkin_dismissed", new Date().toDateString())
    setCheckinDismissed(true)
  }

  const handleSend = async (content: string) => {
    dismissCheckin()

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const isFirstMessage = messages.length === 0
    const nextMessages = [...messages, userMessage]

    // Auto-title from first message using Groq
    if (isFirstMessage) {
      updateSession(activeId, { messages: nextMessages, preview: content })
      // Generate a smart title in background
      sendMessageToGrok([
        {
          role: "system",
          content: `Generate a short 4-6 word chat title that captures the topic of this message. 
Reply with ONLY the title, no quotes, no punctuation at the end, no explanation.
Examples: "Feeling stressed about deadlines", "Monday morning check-in", "Work motivation boost"`,
        },
        { role: "user", content },
      ]).then((title) => {
        updateSession(activeId, { title: title.trim().slice(0, 40) })
      }).catch(() => {
        const fallback = content.length > 30 ? content.slice(0, 30) + "…" : content
        updateSession(activeId, { title: fallback })
      })
    } else {
      updateSession(activeId, { messages: nextMessages })
    }

    setIsSending(true)

    try {
      // Sentiment analysis
      const sentimentResponse = await sendMessageToGrok([
        {
          role: "system",
          content: `You are a sentiment analyzer. Analyze the emotional tone of the user message and respond ONLY with a valid JSON object like this:
{"sentiment": "positive" | "neutral" | "negative", "score": 0.0 to 1.0}
Where score means: 1.0 = very positive, 0.5 = neutral, 0.0 = very negative.
No explanation. No markdown. Just raw JSON.`,
        },
        { role: "user", content },
      ])

      try {
        const cleaned = sentimentResponse.replace(/```json/g, "").replace(/```/g, "").trim()
        const parsed = JSON.parse(cleaned)
        setChatAnalysis({ sentiment: parsed.sentiment, score: parsed.score })
      } catch {
        setChatAnalysis({ sentiment: "neutral", score: 0.5 })
      }

      // Get AI reply
      const history: Message[] = nextMessages.map((m) => ({ role: m.role, content: m.content }) as Message)
      const replyText = await sendMessageToGrok(history)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText || "I'm here to listen. Tell me more.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      updateSession(activeId, { messages: [...nextMessages, assistantMessage] })
    } catch {
      updateSession(activeId, {
        messages: [...nextMessages, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I had trouble responding. Try again?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }],
      })
    } finally {
      setIsSending(false)
    }
  }

  const lastSentiment = chatAnalysis?.sentiment ?? null
  const checkinQuestion = getCheckinQuestion(lastSentiment)
  const quickReplies = getQuickReplies(lastSentiment)

  const sidebarSessions: ChatSession[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    preview: s.preview,
  }))

  return (
    <EmployeeLayout
      sessions={sidebarSessions}
      activeSessionId={activeId}
      onSelectSession={setActiveId}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
    >
      <CameraToggle />
      <div className="flex flex-1 flex-col gap-5">

        {/* Smart check-in */}
        {!checkinDismissed && messages.length === 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">Daily check-in</span>
              <button onClick={dismissCheckin} className="text-xs text-blue-400 hover:text-blue-600">Dismiss</button>
            </div>
            <p className="mb-3 text-sm text-blue-900">{checkinQuestion}</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  disabled={isSending}
                  className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-[420px] flex-1 rounded-2xl border border-(--color-border) bg-white p-4 shadow-sm sm:p-5">
          <ChatWindow messages={messages} />
        </div>

        <div className="space-y-3">
          <ChatInput onSend={handleSend} disabled={isSending} />
          <ConfidentialityNotice />
        </div>
      </div>
    </EmployeeLayout>
  )
}