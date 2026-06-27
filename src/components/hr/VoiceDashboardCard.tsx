import { Mic } from "lucide-react"
import { DashboardCard } from "./DashboardCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { useFer } from "@/lib/FerContext"

export function VoiceDashboardCard({ overrideResult, overrideHistory }: { overrideResult?: any; overrideHistory?: any[] } = {}) {
  const { voiceResult: ctxVoice, voiceHistory: ctxVoiceHistory } = useFer()
  const voiceResult = overrideResult ?? ctxVoice
  const voiceHistory = overrideHistory ?? ctxVoiceHistory

  if (!voiceResult) {
    return (
      <DashboardCard title="Voice Emotion Analysis" description="Prosody signals from employee voice samples" icon={Mic}>
        <EmptyState compact icon={Mic} title="Waiting for voice signals" description="Voice analysis will appear here once the employee records a sample." />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Voice Emotion Analysis" description="Prosody signals from employee voice samples" icon={Mic}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-(--color-surface-subtle) px-4 py-3">
          <div>
            <p className="text-xs text-(--color-ink-faint)">Dominant emotion</p>
            <p className="text-lg font-semibold capitalize text-(--color-ink)">{voiceResult.dominant}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-(--color-ink-faint)">Confidence</p>
            <p className="text-lg font-semibold text-(--color-ink)">{Math.round(voiceResult.confidence * 100)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-(--color-ink-faint)">Last updated</p>
            <p className="text-sm font-medium text-(--color-ink)">{voiceResult.timestamp}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-(--color-ink-faint)">Top emotions</p>
          {voiceResult.emotions.map((e: any) => (
            <div key={e.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize text-(--color-ink-soft)">{e.name}</span>
                <span className="text-(--color-ink)">{Math.round(e.score * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-muted)">
                <div className="h-full rounded-full bg-(--color-accent)" style={{ width: `${Math.round(e.score * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {voiceHistory.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-medium text-(--color-ink-faint)">Recent history</p>
            <div className="flex flex-wrap gap-2">
              {voiceHistory.slice(-6).reverse().map((r: any, i: number) => (
                <span key={i} className="rounded-full bg-(--color-surface-muted) px-2.5 py-1 text-xs capitalize text-(--color-ink-soft)">
                  {r.dominant} · {r.timestamp}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  )
}
