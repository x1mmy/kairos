"use client"

import { useSearchParams } from "next/navigation"
import { FormEvent, Suspense, useMemo, useState } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get("next") ?? "/", [searchParams])
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch("/api/auth/password-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next: nextPath }),
    })
    const payload = await response.json().catch(() => ({}))

    setLoading(false)

    if (!response.ok) {
      setError(payload.error ?? "Incorrect password.")
      return
    }

    window.location.href = payload.next ?? nextPath
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full space-y-6 rounded-lg border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Kairos</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the app password to continue.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 placeholder:text-slate-400 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-slate-500">
          Set <code>KAIROS_APP_PASSWORD</code> in <code>.env.local</code>.
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
          <div className="w-full space-y-6 rounded-lg border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading…</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
