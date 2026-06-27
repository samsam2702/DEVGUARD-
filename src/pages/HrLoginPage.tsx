import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/shared/Logo"
import { Card } from "@/components/ui/card"



export function HrLoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  async function handleSignIn() {
    setError("")
    if (!form.email.trim() || !form.password.trim()) { setError("Please fill in all fields."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/hr/signin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Sign in failed."); setLoading(false); return }
      localStorage.setItem("devguard_hr_token", data.token)
      localStorage.setItem("devguard_hr_user", data.email)
      navigate("/hr")
    } catch { setError("Cannot connect to server. Please try again."); setLoading(false) }
  }

  async function handleSignUp() {
    setError("")
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) { setError("Please fill in all fields."); return }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return }
    if (!form.email.includes("@")) { setError("Please enter a valid email address."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/hr/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Sign up failed."); setLoading(false); return }
      localStorage.setItem("devguard_hr_token", data.token)
      localStorage.setItem("devguard_hr_user", data.email)
      navigate("/hr")
    } catch { setError("Cannot connect to server. Please try again."); setLoading(false) }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-(--color-surface-subtle) px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo iconClassName="h-11 w-11" className="mb-5 [&>span]:text-2xl" />
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <ShieldCheck className="h-5 w-5 text-purple-600" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-(--color-ink)">HR / Manager Portal</h1>
              <p className="text-xs text-(--color-ink-faint)">Workplace analytics dashboard</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex rounded-lg border border-(--color-border) p-1">
            <button onClick={() => { setTab("signin"); setError("") }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "signin" ? "bg-purple-600 text-white" : "text-(--color-ink-faint) hover:text-(--color-ink)"}`}>
              Sign In
            </button>
            <button onClick={() => { setTab("signup"); setError("") }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "signup" ? "bg-purple-600 text-white" : "text-(--color-ink-faint) hover:text-(--color-ink)"}`}>
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Full Name</label>
                <input type="text" placeholder="e.g. Priya Sharma"
                  value={form.name} onChange={set("name")}
                  className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-ink) outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Work Email</label>
              <input type="email" placeholder="hr@company.com"
                value={form.email} onChange={set("email")}
                onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
                className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-ink) outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password"
                  value={form.password} onChange={set("password")}
                  onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
                  className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 pr-10 text-sm text-(--color-ink) outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-ink-faint) hover:text-(--color-ink)">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {tab === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--color-ink-faint)">Confirm Password</label>
                <input type="password" placeholder="Re-enter your password"
                  value={form.confirmPassword} onChange={set("confirmPassword")}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                  className="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-ink) outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={tab === "signin" ? handleSignIn : handleSignUp}
              disabled={loading}
              style={{backgroundColor:"#7c3aed",color:"#fff",width:"100%",padding:"10px",borderRadius:"8px",fontSize:"14px",fontWeight:500,border:"none",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}
            >
              {loading ? "Please wait..." : tab === "signin" ? "Sign In" : "Create HR Account"}
            </button>
          </div>

          {tab === "signin" && (
            <p className="mt-4 text-center text-xs text-(--color-ink-faint)">
              Don't have an account?{" "}
              <button onClick={() => setTab("signup")} className="text-purple-600 hover:underline">Sign up</button>
            </p>
          )}
          {tab === "signup" && (
            <p className="mt-4 text-center text-xs text-(--color-ink-faint)">
              Already have an account?{" "}
              <button onClick={() => setTab("signin")} className="text-purple-600 hover:underline">Sign in</button>
            </p>
          )}
        </Card>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-(--color-ink-faint) hover:text-(--color-ink)">
            <ArrowLeft size={12} /> Back to role selection
          </Link>
        </div>
      </div>
    </div>
  )
}
