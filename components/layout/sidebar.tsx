"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type SidebarProps = {
  email?: string
  onNavigate?: () => void
}

const navSections = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/" }],
  },
  {
    label: "Work",
    items: [{ label: "Entry Log", href: "/log" }],
  },
  {
    label: "Invoicing",
    items: [
      { label: "Invoices", href: "/invoices" },
      { label: "Build Invoice", href: "/invoices/new" },
    ],
  },
  {
    label: "Config",
    items: [
      { label: "Payees", href: "/payees" },
      { label: "Settings", href: "/settings" },
    ],
  },
] as const

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true
  if (!pathname.startsWith(`${href}/`)) return false
  // Sibling routes: list page is /invoices, builder is /invoices/new — do not mark both active.
  if (href === "/invoices" && pathname.startsWith("/invoices/new")) return false
  return true
}

export function Sidebar({ email, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white p-4">
      <div className="mb-6 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm">
        KAIROS
      </div>

      <nav className="space-y-4 text-sm text-slate-700">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className={`block rounded-md px-3 py-2 transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 shadow-sm">
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
