import { useState } from "react"
import { Users, Plus, X, Trash2, ChevronRight } from "lucide-react"
import { DashboardCard } from "./DashboardCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { useFer } from "@/lib/FerContext"
import { useEmployees, calcTenure, type Employee } from "@/lib/useEmployees"

function WellnessPanel({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { chatAnalysis } = useFer()
  const sentimentColor =
    chatAnalysis?.sentiment === "positive" ? "text-green-600"
    : chatAnalysis?.sentiment === "negative" ? "text-red-500"
    : "text-yellow-500"
  const statusLabel =
    chatAnalysis?.sentiment === "positive" ? "✓ Doing Well"
    : chatAnalysis?.sentiment === "negative" ? "⚠ Needs Attention"
    : "— Monitoring"

  return (
    <div className="mt-3 rounded-xl border border-(--color-border) bg-(--color-surface-raised) p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-(--color-ink)">{employee.name}</span>
        <button onClick={onClose} className="rounded p-0.5 text-(--color-ink-faint) hover:text-(--color-ink)">
          <X size={14} />
        </button>
      </div>
      <div className="mb-3 space-y-0.5 text-(--color-ink-faint)">
        <div>{employee.role} · {employee.department}</div>
        <div>Tenure: {calcTenure(employee.joinDate)}</div>
        <div className="text-xs">{employee.email}</div>
      </div>
      {chatAnalysis ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-(--color-ink-faint)">Sentiment</span>
            <span className={`font-medium capitalize ${sentimentColor}`}>{chatAnalysis.sentiment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-(--color-ink-faint)">Wellness Score</span>
            <span className="font-medium text-(--color-ink)">{Math.round(chatAnalysis.score * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-(--color-border)">
            <div
              className={`h-1.5 rounded-full transition-all ${
                chatAnalysis.sentiment === "positive" ? "bg-green-500"
                : chatAnalysis.sentiment === "negative" ? "bg-red-400"
                : "bg-yellow-400"
              }`}
              style={{ width: `${Math.round(chatAnalysis.score * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-(--color-ink-faint)">Status</span>
            <span className={`font-medium ${sentimentColor}`}>{statusLabel}</span>
          </div>
          <div className="pt-1 text-xs text-(--color-ink-faint)">
            Last updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-(--color-ink-faint)">No chat data yet. Employee needs to use the chat portal first.</p>
      )}
    </div>
  )
}

const EMPTY_FORM = { employeeId: "", name: "", role: "", department: "", email: "", joinDate: "" }

function AddEmployeeForm({ onAdd, onCancel }: { onAdd: (data: typeof EMPTY_FORM) => void; onCancel: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({})
  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function validate() {
    const errs: Partial<typeof EMPTY_FORM> = {}
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
    onAdd(form)
  }

  const fields: { key: keyof typeof EMPTY_FORM; label: string; type?: string; placeholder?: string }[] = [
    { key: "employeeId", label: "Employee ID", placeholder: "EMP-001" },
    { key: "name",       label: "Full Name",   placeholder: "Jane Doe" },
    { key: "role",       label: "Role",        placeholder: "Software Engineer" },
    { key: "department", label: "Department",  placeholder: "Engineering" },
    { key: "email",      label: "Email",       type: "email", placeholder: "jane@company.com" },
    { key: "joinDate",   label: "Join Date",   type: "date" },
  ]

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface-raised) p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-(--color-ink)">Add Employee</span>
        <button onClick={onCancel} className="text-(--color-ink-faint) hover:text-(--color-ink)"><X size={14} /></button>
      </div>
      <div className="space-y-2">
        {fields.map(({ key, label, type = "text", placeholder }) => (
          <div key={key}>
            <label className="mb-0.5 block text-xs text-(--color-ink-faint)">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={set(key)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-ink) outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)/30"
            />
            {errors[key] && <p className="mt-0.5 text-xs text-red-500">{errors[key]}</p>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={handleSubmit} className="flex-1 rounded-lg bg-(--color-primary) px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
          Save Employee
        </button>
        <button onClick={onCancel} className="flex-1 rounded-lg border border-(--color-border) px-3 py-1.5 text-sm text-(--color-ink-faint) hover:text-(--color-ink)">
          Cancel
        </button>
      </div>
    </div>
  )
}

function EmployeeRow({ employee, selected, onSelect, onDelete }: {
  employee: Employee; selected: boolean; onSelect: () => void; onDelete: () => void
}) {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        selected
          ? "border-(--color-primary)/40 bg-(--color-primary)/8"
          : "border-(--color-border) hover:border-(--color-primary)/30 hover:bg-(--color-surface-raised)"
      }`}
      onClick={onSelect}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/15 text-sm font-semibold text-(--color-primary)">
        {employee.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-(--color-ink)">{employee.name}</div>
        <div className="truncate text-xs text-(--color-ink-faint)">{employee.role} · {calcTenure(employee.joinDate)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="rounded p-1 text-transparent group-hover:text-(--color-ink-faint) hover:!text-red-400"
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={14} className={selected ? "text-(--color-primary)" : "text-(--color-ink-faint)"} />
      </div>
    </div>
  )
}

export function EmployeeListPanel() {
  const { employees, addEmployee, removeEmployee } = useEmployees()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const selectedEmployee = employees.find((e) => e.id === selectedId) ?? null

  function handleAdd(data: typeof EMPTY_FORM) {
    addEmployee(data)
    setShowForm(false)
  }

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
    setShowForm(false)
  }

  function handleDelete(id: string) {
    removeEmployee(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <DashboardCard
      title="Employee Wellness Monitoring"
      description="Manage employees and view individual signals"
      icon={Users}
    >
      {/* Add button always visible at top */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setSelectedId(null) }}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--color-primary)/40 py-2 text-sm font-medium text-(--color-primary) hover:bg-(--color-primary)/5"
        >
          <Plus size={14} /> Add Employee
        </button>
      )}

      {showForm && (
        <div className="mb-3">
          <AddEmployeeForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {employees.length > 0 ? (
        <div className="scrollbar-thin max-h-72 space-y-1.5 overflow-y-auto pr-0.5">
          {employees.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              selected={emp.id === selectedId}
              onSelect={() => handleSelect(emp.id)}
              onDelete={() => handleDelete(emp.id)}
            />
          ))}
        </div>
      ) : (
        !showForm && <EmptyState compact icon={Users} title="No employees yet" description="Click above to add your first employee" />
      )}

      {selectedEmployee && !showForm && (
        <WellnessPanel employee={selectedEmployee} onClose={() => setSelectedId(null)} />
      )}
    </DashboardCard>
  )
}
