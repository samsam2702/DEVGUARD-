import { useState, useRef, useEffect } from "react"
import { Mic, Send } from "lucide-react"
import { useFer } from "@/lib/FerContext"
import { analyzeVoiceAudio } from "@/lib/voiceAnalysis"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend?: (value: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setVoiceResult } = useFer()

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend?.(trimmed)
    setValue("")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const onSendRef = useRef(onSend)
  useEffect(() => { onSendRef.current = onSend }, [onSend])

  const handleMicToggle = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // ── 1. Web Speech API for transcription ──────────────────────────────
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = "en-US"

        let finalTranscript = ""

        recognition.onresult = (event: any) => {
          let interim = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) finalTranscript += t + " "
            else interim = t
          }
          setValue(finalTranscript + interim)
        }

        recognition.onerror = (e: any) => console.warn("Speech recognition error:", e.error)

        recognition.onend = () => {
          setIsRecording(false)
          mediaRecorderRef.current?.stop()
          // Auto-send immediately when speech ends
          const text = finalTranscript.trim()
          if (text) {
            onSendRef.current?.(text)
            setValue("")
            finalTranscript = ""
          }
        }

        recognitionRef.current = recognition
        recognition.start()
      }

      // ── 2. MediaRecorder for voice emotion analysis ───────────────────────
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        stream.getTracks().forEach((t) => t.stop())
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const arrayBuffer = await blob.arrayBuffer()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          const result = analyzeVoiceAudio(audioBuffer)
          setVoiceResult(result)
          console.log("🎤 Voice emotion:", result.dominant)
        } catch (err) { console.error("Voice analysis error:", err) }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)

    } catch (err) {
      console.error("Mic unavailable:", err)
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-(--color-border) bg-white p-1.5 pl-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20">
      {/* Mic button */}
      <button
        type="button"
        onClick={handleMicToggle}
        aria-label={isRecording ? "Stop recording" : "Start voice input"}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
          isRecording ? "relative bg-red-50" : "text-(--color-ink-faint) hover:bg-(--color-surface-muted)"
        )}
      >
        {isRecording ? (
          <>
            <style>{`
              @keyframes wave { 0%,100%{height:4px} 50%{height:16px} }
              .wave-bar { width:2px; background:#dc2626; animation:wave 0.6s ease-in-out infinite; margin:0 1px; }
            `}</style>
            <div className="flex h-6 w-6 items-end justify-center gap-1">
              <div className="wave-bar" style={{ animationDelay: "0s" }} />
              <div className="wave-bar" style={{ animationDelay: "0.2s" }} />
              <div className="wave-bar" style={{ animationDelay: "0.4s" }} />
            </div>
          </>
        ) : (
          <Mic className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </button>

      {/* Input — shows live transcript while recording */}
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        type="text"
        placeholder={isRecording ? "Listening… speak now" : "Type a message to your DevGuard assistant…"}
        disabled={disabled}
        className="h-9 flex-1 bg-transparent text-sm text-(--color-ink) placeholder:text-(--color-ink-faint) focus:outline-none disabled:opacity-50"
      />

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          backgroundColor: canSend ? "#2563eb" : "#d1d5db",
          color: "#fff",
          width: 36, height: 36,
          borderRadius: 10,
          border: "none",
          cursor: canSend ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 0.15s",
        }}
      >
        <Send size={16} strokeWidth={2.25} />
      </button>
    </div>
  )
}
