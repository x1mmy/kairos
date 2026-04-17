type SidebarProps = {
  email?: string
}

export function Sidebar({ email }: SidebarProps) {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-6 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
        Kairos
      </div>

      <nav className="space-y-1 text-sm text-slate-700">
        <p className="rounded-md px-3 py-2 font-medium">Overview</p>
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600">
          {email ?? "Signed in"}
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
