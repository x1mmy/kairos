"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get("next") ?? "/app", [searchParams])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    window.location.href = nextPath
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full space-y-6 rounded-lg border border-slate-200 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Kairos</h1>
          <p className="mt-1 text-sm text-slate-600">Use your work account credentials.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 placeholder:text-slate-400 focus:ring-2"
              placeholder="you@company.com"
            />
          </div>

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

        <Link className="block text-sm text-slate-600 underline" href="/login/forgot">
          Forgot your password?
        </Link>
      </div>
    </main>
  )
}
