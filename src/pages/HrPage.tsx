import { useState } from "react"
import { MessageSquare, Activity, ClipboardList, ChevronDown } from "lucide-react"
import { HrLayout } from "@/layouts/HrLayout"
import { StatusCard } from "@/components/hr/StatusCard"
import { RiskCard } from "@/components/hr/RiskCard"
import { RootCauseCard } from "@/components/hr/RootCauseCard"
import { SignalBreakdown } from "@/components/hr/SignalBreakdown"
import { SummaryCard } from "@/components/hr/SummaryCard"
import { SystemStatusCard } from "@/components/hr/SystemStatusCard"
import { AnalysisCard } from "@/components/hr/AnalysisCard"
import { FerDashboardCard } from "@/components/hr/FerDashboardCard"
import { VoiceDashboardCard } from "@/components/hr/VoiceDashboardCard"
import { EmployeesSection } from "@/pages/EmployeesSection"
import { useFer, loadEmployeeAnalysis, type EmployeeAnalysisData } from "@/lib/FerContext"
import { Settings, Shield, Bell, Monitor, Trash2 } from "lucide-react"
import { useEmployees, calcTenure } from "@/lib/useEmployees"

function OverviewSection() {
  const { employees } = useEmployees()
  const [selectedId, setSelectedId] = useState<string>("")
  const [empAnalysis, setEmpAnalysis] = useState<EmployeeAnalysisData | null>(null)

  const selected = employees.find((e) => e.id === selectedId) ?? null

  // Load analysis data for selected employee
  // Scans all saved analysis keys and finds best match by employeeId or name
  function handleSelectEmployee(id: string) {
    setSelectedId(id)
    const emp = employees.find((e) => e.id === id)
    if (!emp) return

    // Try all possible username formats
    const candidates = [
      emp.employeeId,
      emp.employeeId.toLowerCase(),
      emp.name.toLowerCase(),
      emp.name.toLowerCase().replace(/\s+/g, ""),
      emp.name.toLowerCase().replace(/\s+/g, "_"),
      emp.email?.split("@")[0] ?? "",
    ]

    let found = null
    for (const candidate of candidates) {
      const data = loadEmployeeAnalysis(candidate)
      if (data.chatAnalysis || data.faceResult || data.voiceResult) {
        found = data
        break
      }
    }

    // Also scan all localStorage keys for devguard_analysis_*
    if (!found) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith("devguard_analysis_")) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}")
            if (data.chatAnalysis || data.faceResult || data.voiceResult) {
              found = data
              break
            }
          } catch {}
        }
      }
    }

    setEmpAnalysis(found)
  }

  const chatAnalysis = empAnalysis?.chatAnalysis ?? null
  const faceResult = empAnalysis?.faceResult ?? null
  const voiceResult = empAnalysis?.voiceResult ?? null
  const faceHistory = empAnalysis?.faceHistory ?? []
  const voiceHistory = empAnalysis?.voiceHistory ?? []

  const sentimentColor =
    chatAnalysis?.sentiment === "positive" ? "text-green-600"
    : chatAnalysis?.sentiment === "negative" ? "text-red-500"
    : "text-yellow-500"

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-(--color-ink)">Management Analytics Dashboard</h1>
          <p className="text-sm text-(--color-ink-faint)">Aggregated behavioral signals across chat, voice and facial analysis.</p>
        </div>

        {/* Employee selector */}
        <div className="relative shrink-0">
          <select
            value={selectedId}
            onChange={(e) => { if (!e.target.value) { setSelectedId(""); setEmpAnalysis(null); } else handleSelectEmployee(e.target.value) }}
            className="appearance-none rounded-lg border border-(--color-border) bg-white py-2 pl-3 pr-8 text-sm text-(--color-ink) shadow-sm outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint)" />
        </div>
      </div>

      {/* Selected employee banner */}
      {selected && (
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/5 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-primary)/15 text-sm font-bold text-(--color-primary)">
            {selected.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="font-medium text-(--color-ink)">{selected.name}</span>
            <span className="ml-2 text-sm text-(--color-ink-faint)">{selected.role} · {selected.department}</span>
          </div>
          <div className="text-sm text-(--color-ink-faint)">Tenure: {calcTenure(selected.joinDate)}</div>
          {chatAnalysis && (
            <span className={`text-sm font-semibold capitalize ${sentimentColor}`}>
              {chatAnalysis.sentiment}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard title="Employee Status" />
        <StatusCard title="Psychological Status" />
        <RiskCard />
        <SystemStatusCard />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RootCauseCard />
        <SignalBreakdown />
        <SummaryCard title="Behavioral Summary" description="Narrative overview of recent signals" icon={ClipboardList} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AnalysisCard
          title="Chat Analysis"
          description="Sentiment derived from text conversations"
          icon={MessageSquare}
          metrics={
            chatAnalysis
              ? [
                  { id: "sentiment", label: "Sentiment", value: chatAnalysis.sentiment.charAt(0).toUpperCase() + chatAnalysis.sentiment.slice(1) },
                  { id: "score",     label: "Wellness Score", value: `${Math.round(chatAnalysis.score * 100)}%` },
                  { id: "status",    label: "Status", value: chatAnalysis.sentiment === "negative" ? "⚠ Needs Attention" : chatAnalysis.sentiment === "positive" ? "✓ Doing Well" : "— Monitoring" },
                  { id: "last",      label: "Last Updated", value: empAnalysis?.updatedAt ? new Date(empAnalysis.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—" },
                ]
              : undefined
          }
        />
        <VoiceDashboardCard overrideResult={voiceResult} overrideHistory={voiceHistory} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FerDashboardCard overrideResult={faceResult} overrideHistory={faceHistory} />
        <SummaryCard title="Monitoring Summary" description="Current monitoring coverage and cadence" icon={Activity} />
      </div>
    </>
  )
}


function SettingsSection() {
  const [company, setCompany] = useState("My Company")
  const [hrEmail, setHrEmail] = useState("")
  const [alertThreshold, setAlertThreshold] = useState(40)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [facialEnabled, setFacialEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    localStorage.setItem("devguard_settings", JSON.stringify({
      company, hrEmail, alertThreshold, chatEnabled, voiceEnabled, facialEnabled
    }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClearData() {
    if (confirm("This will clear all chat history and employee data. Are you sure?")) {
      localStorage.removeItem("devguard_sessions")
      localStorage.removeItem("devguard_chat_analysis")
      localStorage.removeItem("devguard_checkin_dismissed")
      alert("Data cleared successfully.")
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-(--color-ink)">Settings</h1>
        <p className="text-sm text-(--color-ink-faint)">Configure DevGuard for your organisation</p>
      </div>

      <div className="space-y-4">

        {/* Company Profile */}
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-(--color-primary)" />
            <h2 className="font-semibold text-(--color-ink)">Company Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Company Name</label>
              <input value={company} onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-ink) outline-none focus:border-(--color-primary)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">HR Contact Email</label>
              <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="hr@company.com"
                className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-ink) outline-none focus:border-(--color-primary)"
              />
            </div>
          </div>
        </div>

        {/* Alert Threshold */}
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={16} className="text-(--color-primary)" />
            <h2 className="font-semibold text-(--color-ink)">Alert Threshold</h2>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-(--color-ink-faint)">Flag employee if wellness score drops below</label>
              <span className="font-semibold text-(--color-primary)">{alertThreshold}%</span>
            </div>
            <input type="range" min={10} max={80} value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-(--color-ink-faint)">
              <span>10% (low sensitivity)</span>
              <span>80% (high sensitivity)</span>
            </div>
          </div>
        </div>

        {/* Monitoring Toggles */}
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Monitor size={16} className="text-(--color-primary)" />
            <h2 className="font-semibold text-(--color-ink)">Monitoring Modules</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Chat Analysis", desc: "Sentiment from employee conversations", value: chatEnabled, set: setChatEnabled },
              { label: "Voice Analysis", desc: "Emotion from voice recordings", value: voiceEnabled, set: setVoiceEnabled },
              { label: "Facial Analysis", desc: "Expression detection via camera", value: facialEnabled, set: setFacialEnabled },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-(--color-ink)">{label}</div>
                  <div className="text-xs text-(--color-ink-faint)">{desc}</div>
                </div>
                <button
                  onClick={() => set((v: boolean) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-(--color-border)"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" />
            <h2 className="font-semibold text-(--color-ink)">Data Management</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-(--color-ink)">Clear All Chat History</div>
              <div className="text-xs text-(--color-ink-faint)">Removes all sessions and sentiment data</div>
            </div>
            <button onClick={handleClearData}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            style={{backgroundColor:"#2563eb",color:"#fff",padding:"10px 24px",borderRadius:"8px",fontSize:"14px",fontWeight:500,border:"none",cursor:"pointer"}}
          >
            Save Settings
          </button>
          {saved && <span className="text-sm text-green-600">✓ Saved successfully</span>}
        </div>
      </div>
    </div>
  )
}

export function HrPage() {
  const [section, setSection] = useState("overview")

  return (
    <HrLayout activeSection={section} onSelectSection={setSection}>
      {section === "settings" ? <SettingsSection /> : section === "employees" ? <EmployeesSection /> : <OverviewSection />}
    </HrLayout>
  )
}
