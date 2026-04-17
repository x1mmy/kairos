import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { createClient } from "@/utils/supabase/server"

export default async function AppHomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/app")
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar email={user.email} />
        <section className="flex-1 p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Kairos</h1>
          <p className="mt-2 text-slate-600">
            Auth flow is ready. Next step is wiring the app shell and feature pages.
          </p>
        </section>
      </div>
    </main>
  )
}
