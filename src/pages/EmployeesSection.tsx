import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Users2, X, Trash2, Pencil, AlertCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { useEmployees, calcTenure, type Employee } from "@/lib/useEmployees"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function getEmployeeAnalysis(username: string) {
  try {
    const raw = localStorage.getItem(`devguard_analysis_${username.toLowerCase()}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function getNegativeEvidence(username: string): { content: string; timestamp: string; session: string }[] {
  try {
    const sessionsKey = `devguard_sessions_${username.toLowerCase()}`
    const raw = localStorage.getItem(sessionsKey)
    if (!raw) return []
    const sessions = JSON.parse(raw)
    const results: { content: string; timestamp: string; session: string }[] = []
    const distressKeywords = ["stressed", "hate", "tired", "overwhelmed", "quit", "can't", "cannot", "anxious", "sad", "angry", "frustrated", "burnout", "exhausted", "depressed", "scared", "worried", "unfair", "pressure", "stuck"]
    for (const session of sessions) {
      for (const msg of session.messages ?? []) {
        if (msg.role === "user") {
          const hasDistress = distressKeywords.some((kw) => msg.content.toLowerCase().includes(kw))
          if (hasDistress) {
            results.push({ content: msg.content, timestamp: msg.timestamp, session: session.title })
          }
        }
      }
    }
    return results.slice(-10)
  } catch { return [] }
}

function EvidencePanel({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const username = employee.username?.trim() ?? ""
  const empData = username ? getEmployeeAnalysis(username) : null
  const chatAnalysis = empData?.chatAnalysis ?? null
  const evidence = username ? getNegativeEvidence(username) : []

  return (
    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <span className="font-semibold text-red-700">Alert Evidence</span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
            {evidence.length} flagged message{evidence.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button onClick={onClose} className="text-red-400 hover:text-red-600"><X size={15} /></button>
      </div>

      {chatAnalysis && (
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-white border border-red-100 px-4 py-3 text-sm">
          <div>
            <div className="text-xs text-red-400 font-medium">Latest Sentiment</div>
            <div className="font-semibold text-red-600 capitalize">{chatAnalysis.sentiment}</div>
          </div>
          <div>
            <div className="text-xs text-red-400 font-medium">Wellness Score</div>
            <div className="font-semibold text-red-600">{Math.round(chatAnalysis.score * 100)}%</div>
          </div>
          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-red-100">
              <div className="h-2 rounded-full bg-red-400 transition-all" style={{ width: `${Math.round(chatAnalysis.score * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {evidence.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-500 mb-2">Messages that triggered the alert:</p>
          {evidence.map((e, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-white border border-red-100 px-4 py-3">
              <MessageSquare size={14} className="mt-0.5 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-red-800">"{e.content}"</p>
                <div className="mt-1 flex gap-3 text-xs text-red-400">
                  <span>{e.timestamp}</span>
                  <span>·</span>
                  <span>{e.session}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-red-100 px-4 py-6 text-center">
          <p className="text-sm text-red-400">No specific distress keywords detected in chat history.</p>
          <p className="text-xs text-red-300 mt-1">Alert was triggered by overall negative sentiment tone.</p>
        </div>
      )}
    </div>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const selected = value ? new Date(value + "T00:00:00") : null
  return (
    <DatePicker
      selected={selected}
      onChange={(date: Date | null) => {
        if (date) {
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, "0")
          const d = String(date.getDate()).padStart(2, "0")
          onChange(`${y}-${m}-${d}`)
        } else { onChange("") }
      }}
      dateFormat="dd/MM/yyyy"
      placeholderText="DD/MM/YYYY"
      maxDate={new Date()}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-ink) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20"
    />
  )
}

type EditableFields = {
  employeeId: string; name: string; role: string; department: string; email: string; joinDate: string; username: string
}

function EmployeeForm({ initial, onSave, onCancel, title }: {
  initial: EditableFields; onSave: (data: EditableFields) => void; onCancel: () => void; title: string
}) {
  const [form, setForm] = useState<EditableFields>(initial)
  const [errors, setErrors] = useState<Partial<EditableFields>>({})
  const set = (field: keyof EditableFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  function validate() {
    const errs: Partial<EditableFields> = {}
    if (!form.employeeId.trim()) errs.employeeId = "Required"
    if (!form.name.trim())       errs.name       = "Required"
    if (!form.role.trim())       errs.role       = "Required"
    if (!form.department.trim()) errs.department = "Required"
    if (!form.email.trim())      errs.email      = "Required"
    if (!form.joinDate)          errs.joinDate   = "Required"
    return errs
  }
  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
  }
  const fields: { key: keyof EditableFields; label: string; type?: string; placeholder?: string }[] = [
    { key: "employeeId", label: "Employee ID",      placeholder: "EMP-001" },
    { key: "username",   label: "Login Username",   placeholder: "Same as employee login (e.g. sam123)" },
    { key: "name",       label: "Full Name",        placeholder: "Jane Doe" },
    { key: "role",       label: "Role",             placeholder: "Software Engineer" },
    { key: "department", label: "Department",       placeholder: "Engineering" },
    { key: "email",      label: "Email",            type: "email", placeholder: "jane@company.com" },
  ]
  return (
    <div className="mb-5 rounded-2xl border border-(--color-border) bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-(--color-ink)">{title}</h3>
        <button onClick={onCancel} className="rounded-lg p-1 text-(--color-ink-faint) hover:text-(--color-ink)"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type = "text", placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">{label}</label>
            <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-ink) outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20"
            />
            {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Join Date</label>
          <DateInput value={form.joinDate} onChange={(val) => setForm((prev) => ({ ...prev, joinDate: val }))} />
          {errors.joinDate && <p className="mt-1 text-xs text-red-500">{errors.joinDate}</p>}
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={handleSubmit} style={{backgroundColor:"#2563eb",color:"#fff",padding:"8px 20px",borderRadius:"8px",fontSize:"14px",fontWeight:500,border:"none",cursor:"pointer"}}>
          Save
        </button>
        <button onClick={onCancel} className="rounded-lg border border-(--color-border) px-5 py-2 text-sm text-(--color-ink-faint) hover:text-(--color-ink)">Cancel</button>
      </div>
    </div>
  )
}

function EmployeeRow({ employee, onDelete, onEdit }: {
  employee: Employee; onDelete: () => void; onEdit: () => void
}) {
  const [showEvidence, setShowEvidence] = useState(false)

  // Load this specific employee's analysis using their linked username
  const username = employee.username?.trim() ?? ""
  const empData = username ? getEmployeeAnalysis(username) : null
  const isAlert = empData?.chatAnalysis?.sentiment === "negative"

  return (
    <div className="rounded-xl border border-(--color-border) bg-white shadow-sm">
      <div className="group flex items-center gap-4 px-4 py-3">
        <div className="relative">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/15 text-base font-bold text-(--color-primary)">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          {isAlert && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-(--color-ink)">{employee.name}</span>
            <span className="font-mono text-xs text-(--color-ink-faint)">{employee.employeeId}</span>
            {isAlert && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">⚠ Needs Attention</span>
            )}
          </div>
          <div className="text-sm text-(--color-ink-faint)">{employee.role} · {employee.department}</div>
          <div className="text-xs text-(--color-ink-faint)">{employee.email}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-(--color-ink-faint)">Joined</div>
          <div className="text-sm font-medium text-(--color-ink)">{formatDate(employee.joinDate)}</div>
          <div className="text-xs text-(--color-ink-faint)">Tenure: {calcTenure(employee.joinDate)}</div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isAlert && (
            <button
              onClick={() => setShowEvidence((v) => !v)}
              className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              <AlertCircle size={12} />
              Evidence
              {showEvidence ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={onEdit} className="rounded-lg p-2 text-(--color-ink-faint) hover:text-(--color-primary)">
              <Pencil size={14} />
            </button>
            <button onClick={onDelete} className="rounded-lg p-2 text-(--color-ink-faint) hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {showEvidence && isAlert && (
        <div className="px-4 pb-4">
          <EvidencePanel employee={employee} onClose={() => setShowEvidence(false)} />
        </div>
      )}
    </div>
  )
}

export function EmployeesSection() {
  const { employees, removeEmployee, updateEmployee } = useEmployees()
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-(--color-ink)">Employees</h1>
          <p className="text-sm text-(--color-ink-faint)">{employees.length} employee{employees.length !== 1 ? "s" : ""} registered</p>
        </div>
      </div>

      {editingEmployee && (
        <EmployeeForm
          title="Edit Employee"
          initial={{...editingEmployee, username: editingEmployee.username ?? ""}}
          onSave={(data) => { updateEmployee(editingEmployee.id, data); setEditingEmployee(null) }}
          onCancel={() => setEditingEmployee(null)}
        />
      )}

      {employees.length > 0 ? (
        <div className="space-y-2">
          {employees.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              onEdit={() => setEditingEmployee(emp)}
              onDelete={() => removeEmployee(emp.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--color-border) py-16 text-center">
          <Users2 size={32} className="mb-3 text-(--color-ink-faint)" />
          <p className="font-medium text-(--color-ink)">No employees yet</p>
          <p className="mt-1 text-sm text-(--color-ink-faint)">Employees will appear here once they sign up</p>
        </div>
      )}
    </div>
  )
}