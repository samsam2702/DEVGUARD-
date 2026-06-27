import { createContext, useContext, useState, type ReactNode } from "react"

export interface ChatAnalysis {
  sentiment: "positive" | "neutral" | "negative"
  score: number
}

export interface EmployeeAnalysisData {
  chatAnalysis: ChatAnalysis | null
  faceResult: any
  faceHistory: any[]
  voiceResult: any
  voiceHistory: any[]
  updatedAt: string
}

// Save all analysis data per employee username
export function saveEmployeeAnalysis(username: string, data: Partial<EmployeeAnalysisData>) {
  const key = `devguard_analysis_${username}`
  const existing = loadEmployeeAnalysis(username)
  const merged = { ...existing, ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(key, JSON.stringify(merged))
}

export function loadEmployeeAnalysis(username: string): EmployeeAnalysisData {
  try {
    const raw = localStorage.getItem(`devguard_analysis_${username}`)
    return raw ? JSON.parse(raw) : { chatAnalysis: null, faceResult: null, faceHistory: [], voiceResult: null, voiceHistory: [], updatedAt: "" }
  } catch {
    return { chatAnalysis: null, faceResult: null, faceHistory: [], voiceResult: null, voiceHistory: [], updatedAt: "" }
  }
}

// List all employees that have analysis data
export function getAllEmployeeAnalyses(): Record<string, EmployeeAnalysisData> {
  const result: Record<string, EmployeeAnalysisData> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith("devguard_analysis_")) {
      const username = key.replace("devguard_analysis_", "")
      result[username] = loadEmployeeAnalysis(username)
    }
  }
  return result
}

interface AnalysisContextValue {
  faceResult: any
  faceHistory: any[]
  voiceResult: any
  voiceHistory: any[]
  chatAnalysis: ChatAnalysis | null
  setFaceResult: (r: any) => void
  setVoiceResult: (r: any) => void
  setChatAnalysis: (r: ChatAnalysis) => void
}

const AnalysisContext = createContext<AnalysisContextValue>({
  faceResult: null,
  faceHistory: [],
  voiceResult: null,
  voiceHistory: [],
  chatAnalysis: null,
  setFaceResult: () => {},
  setVoiceResult: () => {},
  setChatAnalysis: () => {},
})

export function FerProvider({ children }: { children: ReactNode }) {
  const username = localStorage.getItem("devguard_employee_user") || ""
  const saved = loadEmployeeAnalysis(username)

  const [faceResult, setFaceResultState] = useState<any>(saved.faceResult)
  const [faceHistory, setFaceHistory] = useState<any[]>(saved.faceHistory || [])
  const [voiceResult, setVoiceResultState] = useState<any>(saved.voiceResult)
  const [voiceHistory, setVoiceHistory] = useState<any[]>(saved.voiceHistory || [])
  const [chatAnalysis, setChatAnalysisState] = useState<ChatAnalysis | null>(saved.chatAnalysis)

  const setFaceResult = (r: any) => {
    setFaceResultState(r)
    setFaceHistory((prev) => {
      const next = [...prev.slice(-19), r]
      if (username) saveEmployeeAnalysis(username, { faceResult: r, faceHistory: next })
      return next
    })
  }

  const setVoiceResult = (r: any) => {
    setVoiceResultState(r)
    setVoiceHistory((prev) => {
      const next = [...prev.slice(-19), r]
      if (username) saveEmployeeAnalysis(username, { voiceResult: r, voiceHistory: next })
      return next
    })
  }

  const setChatAnalysis = (r: ChatAnalysis) => {
    setChatAnalysisState(r)
    if (username) saveEmployeeAnalysis(username, { chatAnalysis: r })
    // Keep legacy key for backward compat
    localStorage.setItem("devguard_chat_analysis", JSON.stringify(r))
  }

  return (
    <AnalysisContext.Provider value={{ faceResult, faceHistory, voiceResult, voiceHistory, chatAnalysis, setFaceResult, setVoiceResult, setChatAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useFer() {
  return useContext(AnalysisContext)
}
