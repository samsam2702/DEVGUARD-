import { useNavigate } from "react-router-dom"
import { UserRound, ShieldCheck, ArrowRight } from "lucide-react"
import { Logo } from "@/components/shared/Logo"

export function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-(--color-surface-subtle) px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo iconClassName="h-11 w-11" className="mb-5 [&>span]:text-2xl" />
          <h1 className="text-2xl font-bold text-(--color-ink)">Welcome to DevGuard</h1>
          <p className="mt-2 text-sm text-(--color-ink-faint)">AI Workplace Behavioral Intelligence Platform</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Employee */}
          <a href="/employee-login" className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-(--color-border) bg-white p-8 text-center shadow-sm transition-all hover:border-blue-400 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 group-hover:bg-blue-100">
              <UserRound className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-ink)">Employee</h2>
              <p className="mt-1 text-sm text-(--color-ink-faint)">Access your confidential wellness assistant</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-blue-600">
              Sign in as Employee <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </a>

          {/* HR Manager */}
          <a href="/hr-login" className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-(--color-border) bg-white p-8 text-center shadow-sm transition-all hover:border-purple-400 hover:shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 group-hover:bg-purple-100">
              <ShieldCheck className="h-8 w-8 text-purple-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-(--color-ink)">HR / Manager</h2>
              <p className="mt-1 text-sm text-(--color-ink-faint)">View workplace analytics and wellness reports</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-purple-600">
              Sign in as HR <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-(--color-ink-faint)">
          By continuing, you agree to DevGuard's workplace usage and confidentiality policies.
        </p>
      </div>
    </div>
  )
}
